"use client";

import React, { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, fieldLabelClasses } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import {
  upsertGlobalCategoryAction,
  upsertNeighborhoodAction,
} from "@/app/actions/master";
import { cn, sanitizeStoreSlug } from "@/lib/utils";
import type { GlobalCategory, NeighborhoodItem } from "@/types/marketplace";

export interface MasterTaxonomyClientProps {
  initialCategories: GlobalCategory[];
  initialNeighborhoods: NeighborhoodItem[];
}

export function MasterTaxonomyClient({
  initialCategories,
  initialNeighborhoods,
}: MasterTaxonomyClientProps) {
  const [categories, setCategories] =
    useState<GlobalCategory[]>(initialCategories);
  const [neighborhoods, setNeighborhoods] =
    useState<NeighborhoodItem[]>(initialNeighborhoods);
  const [toast, setToast] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Estado do formulário de Categoria / Subcategoria
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catParentId, setCatParentId] = useState<string>("");
  const [catOrderIndex, setCatOrderIndex] = useState<number>(1);
  const [catIsActive, setCatIsActive] = useState<boolean>(true);
  const [hasGender, setHasGender] = useState<boolean>(false);
  const [hasSize, setHasSize] = useState<boolean>(false);
  const [hasVoltage, setHasVoltage] = useState<boolean>(false);
  const [sizeOptionsText, setSizeOptionsText] = useState<string>(
    "PP, P, M, G, GG"
  );

  // Estado do formulário de Bairro
  const [editingNbId, setEditingNbId] = useState<string | null>(null);
  const [nbName, setNbName] = useState("");
  const [nbIsActive, setNbIsActive] = useState(true);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  };

  const mainCategories = useMemo(
    () =>
      categories
        .filter((c) => !c.parent_id)
        .sort((a, b) => a.order_index - b.order_index),
    [categories]
  );

  const getSubcategories = (parentId: string) =>
    categories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.order_index - b.order_index);

  const resetCategoryForm = (defaultParentId = "") => {
    setEditingCatId(null);
    setCatName("");
    setCatSlug("");
    setCatParentId(defaultParentId);
    const siblings = categories.filter((c) =>
      defaultParentId ? c.parent_id === defaultParentId : !c.parent_id
    );
    setCatOrderIndex(siblings.length + 1);
    setCatIsActive(true);
    setHasGender(false);
    setHasSize(false);
    setHasVoltage(false);
    setSizeOptionsText("PP, P, M, G, GG");
  };

  const handleStartEditCategory = (cat: GlobalCategory) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatParentId(cat.parent_id || "");
    setCatOrderIndex(cat.order_index);
    setCatIsActive(cat.is_active);
    setHasGender(Boolean(cat.filter_config?.has_gender));
    setHasSize(Boolean(cat.filter_config?.has_size));
    setHasVoltage(Boolean(cat.filter_config?.has_voltage));
    setSizeOptionsText(
      cat.filter_config?.size_options?.length
        ? cat.filter_config.size_options.join(", ")
        : "PP, P, M, G, GG"
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = catName.trim();
    if (!trimmedName) return;

    const cleanSlug = sanitizeStoreSlug(catSlug || trimmedName);
    const parsedSizes = hasSize
      ? sizeOptionsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const nextCategory: GlobalCategory = {
      id: editingCatId || `temp-cat-${Date.now()}`,
      name: trimmedName,
      slug: cleanSlug,
      parent_id: catParentId || null,
      order_index: Number(catOrderIndex) || 1,
      is_active: catIsActive,
      filter_config: catParentId
        ? {}
        : {
            has_gender: hasGender,
            has_size: hasSize,
            size_options: parsedSizes,
            has_voltage: hasVoltage,
          },
    };

    setCategories((prev) => {
      if (editingCatId) {
        return prev.map((c) => (c.id === editingCatId ? nextCategory : c));
      }
      return [...prev, nextCategory];
    });

    startTransition(async () => {
      await upsertGlobalCategoryAction({
        id: editingCatId || undefined,
        name: nextCategory.name,
        slug: nextCategory.slug,
        parent_id: nextCategory.parent_id,
        order_index: nextCategory.order_index,
        is_active: nextCategory.is_active,
        filter_config: nextCategory.filter_config,
      });
      notify(
        editingCatId
          ? `Categoria "${nextCategory.name}" atualizada!`
          : `Categoria "${nextCategory.name}" adicionada!`
      );
      resetCategoryForm();
    });
  };

  const handleToggleCategoryActive = (cat: GlobalCategory) => {
    const nextActive = !cat.is_active;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: nextActive } : c))
    );

    startTransition(async () => {
      await upsertGlobalCategoryAction({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parent_id: cat.parent_id,
        order_index: cat.order_index,
        is_active: nextActive,
        filter_config: cat.filter_config,
      });
      notify(
        nextActive
          ? `"${cat.name}" ativada no Marketplace.`
          : `"${cat.name}" ocultada.`
      );
    });
  };

  const handleMoveCategoryOrder = (
    cat: GlobalCategory,
    direction: "up" | "down"
  ) => {
    const nextOrder =
      direction === "up"
        ? Math.max(1, cat.order_index - 1)
        : cat.order_index + 1;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, order_index: nextOrder } : c
      )
    );

    startTransition(async () => {
      await upsertGlobalCategoryAction({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parent_id: cat.parent_id,
        order_index: nextOrder,
        is_active: cat.is_active,
        filter_config: cat.filter_config,
      });
      notify(`Ordem de "${cat.name}" alterada para #${nextOrder}.`);
    });
  };

  const handleSaveNeighborhood = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nbName.trim();
    if (!trimmed) return;

    const nextNb: NeighborhoodItem = {
      id: editingNbId || `temp-nb-${Date.now()}`,
      name: trimmed,
      slug: sanitizeStoreSlug(trimmed),
      is_active: nbIsActive,
    };

    setNeighborhoods((prev) => {
      if (editingNbId) {
        return prev.map((n) => (n.id === editingNbId ? nextNb : n));
      }
      return [...prev, nextNb];
    });

    startTransition(async () => {
      await upsertNeighborhoodAction({
        id: editingNbId || undefined,
        name: nextNb.name,
        is_active: nextNb.is_active,
      });
      notify(
        editingNbId
          ? `Bairro "${nextNb.name}" atualizado!`
          : `Bairro "${nextNb.name}" adicionado em Bom Jesus da Lapa!`
      );
      setEditingNbId(null);
      setNbName("");
      setNbIsActive(true);
    });
  };

  const handleToggleNeighborhoodActive = (nb: NeighborhoodItem) => {
    const nextActive = !(nb.is_active ?? true);
    setNeighborhoods((prev) =>
      prev.map((n) => (n.id === nb.id ? { ...n, is_active: nextActive } : n))
    );

    startTransition(async () => {
      await upsertNeighborhoodAction({
        id: nb.id,
        name: nb.name,
        is_active: nextActive,
      });
      notify(
        nextActive
          ? `Bairro "${nb.name}" visível no seletor da cidade.`
          : `Bairro "${nb.name}" ocultado.`
      );
    });
  };

  const sizeChips = sizeOptionsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const removeSize = (sz: string) =>
    setSizeOptionsText(sizeChips.filter((s) => s !== sz).join(", "));
  const [newSize, setNewSize] = useState("");
  const addSize = () => {
    const v = newSize.trim();
    if (!v || sizeChips.includes(v)) return;
    setSizeOptionsText([...sizeChips, v].join(", "));
    setNewSize("");
  };

  const editingCategory = categories.find((c) => c.id === editingCatId) ?? null;
  const editingParent = catParentId
    ? categories.find((c) => c.id === catParentId) ?? null
    : null;
  const editorTitle = editingCategory
    ? editingCategory.name
    : editingParent
    ? `Nova subcategoria de ${editingParent.name}`
    : "Nova categoria";
  const editorSubcategories = editingCategory && !editingCategory.parent_id
    ? getSubcategories(editingCategory.id)
    : [];

  const cardClasses = "p-4 rounded-3xl bg-white flex flex-col gap-1.5 min-w-0";
  const cardHeading = "text-base font-extrabold text-slate-900";
  const plusButton =
    "w-8 h-8 rounded-[10px] bg-brand hover:bg-brand-hover text-white grid place-items-center cursor-pointer transition duration-150 active:scale-95";

  const flagRows = [
    { label: "Gênero", sub: "has_gender", on: hasGender, set: setHasGender },
    { label: "Tamanho", sub: "has_size", on: hasSize, set: setHasSize },
    { label: "Voltagem", sub: "has_voltage", on: hasVoltage, set: setHasVoltage },
  ];

  return (
    <div className="flex flex-col gap-4.5">
      <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">
        Categorias e bairros
      </h1>

      <div aria-live="polite" className="empty:hidden">
        {toast && (
          <div className="rounded-[18px] bg-slate-900 text-white px-4 py-3 text-[13px] font-semibold animate-slide-up">
            {toast}
          </div>
        )}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        {/* Categorias */}
        <section className={cardClasses} aria-label="Categorias globais">
          <div className="flex items-center justify-between px-1 pb-2">
            <h2 className={cardHeading}>Categorias globais</h2>
            <button type="button" onClick={() => resetCategoryForm()} aria-label="Nova categoria" className={plusButton}>
              <Plus className="w-4 h-4" strokeWidth={2.4} />
            </button>
          </div>
          {mainCategories.map((cat) => {
            const selected = editingCatId === cat.id || editingCategory?.parent_id === cat.id;
            const subCount = getSubcategories(cat.id).length;
            return (
              <div
                key={cat.id}
                className={cn(
                  "flex items-center gap-1.5 p-2 rounded-2xl transition-colors duration-150",
                  selected ? "bg-brand-soft shadow-[inset_0_0_0_1.5px_#264E9C]" : "hover:bg-slate-50"
                )}
              >
                <span className="flex flex-col">
                  <button type="button" onClick={() => handleMoveCategoryOrder(cat, "up")} aria-label={`Subir ${cat.name}`} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                    <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </button>
                  <button type="button" onClick={() => handleMoveCategoryOrder(cat, "down")} aria-label={`Descer ${cat.name}`} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                    <ArrowDown className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => handleStartEditCategory(cat)}
                  aria-pressed={selected}
                  className={cn("flex-1 min-w-0 flex flex-col text-left cursor-pointer", !cat.is_active && "opacity-55")}
                >
                  <span className="text-sm font-semibold text-slate-900 truncate">{cat.name}</span>
                  <span className="text-xs text-slate-500">
                    {subCount} {subCount === 1 ? "subcategoria" : "subcategorias"}
                  </span>
                </button>
                <Switch size="sm" checked={cat.is_active} onCheckedChange={() => handleToggleCategoryActive(cat)} aria-label={`Categoria ${cat.name} ativa`} />
              </div>
            );
          })}
        </section>

        {/* Editor */}
        <section className="p-5 rounded-3xl bg-white flex flex-col gap-4 min-w-0" aria-label="Editor de categoria">
          <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-500">{editingCatId ? "Editando" : "Criando"}</span>
              <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-slate-900 truncate">{editorTitle}</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Input inputSize="md" label="Nome" value={catName} onChange={(e) => setCatName(e.target.value)} required />
              <Input inputSize="md" label="Slug" placeholder="gerado pelo nome" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
              <Select
                inputSize="md"
                label="Categoria pai"
                value={catParentId}
                onChange={(e) => setCatParentId(e.target.value)}
                options={[{ value: "", label: "Nenhuma (principal)" }, ...mainCategories.filter((c) => c.id !== editingCatId).map((c) => ({ value: c.id, label: c.name }))]}
              />
              <Input inputSize="md" label="Ordem" type="number" min={1} value={catOrderIndex} onChange={(e) => setCatOrderIndex(Number(e.target.value))} />
            </div>

            <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl bg-slate-50">
              <span className="text-sm font-semibold text-slate-900">Ativa no marketplace</span>
              <Switch checked={catIsActive} onCheckedChange={setCatIsActive} aria-label="Categoria ativa" />
            </div>

            {!catParentId && (
              <>
                <div className="flex flex-col gap-2">
                  <span className={fieldLabelClasses}>Filtros desta categoria</span>
                  {flagRows.map((f) => (
                    <div key={f.sub} className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl bg-slate-50">
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{f.label}</span>
                        <span className="text-xs text-slate-500">{f.sub}</span>
                      </span>
                      <Switch checked={f.on} onCheckedChange={f.set} aria-label={`Filtro de ${f.label.toLowerCase()}`} />
                    </div>
                  ))}
                </div>

                {hasSize && (
                  <div className="flex flex-col gap-2">
                    <span className={fieldLabelClasses}>Opções de tamanho</span>
                    <div className="flex flex-wrap gap-1.5">
                      {sizeChips.map((sz) => (
                        <span key={sz} className="inline-flex items-center gap-1.5 px-2.5 py-1.75 rounded-[11px] bg-slate-100 font-display text-[13px] font-bold text-slate-900">
                          {sz}
                          <button type="button" onClick={() => removeSize(sz)} aria-label={`Remover tamanho ${sz}`} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                            <X className="w-3 h-3" strokeWidth={2.4} />
                          </button>
                        </span>
                      ))}
                      <input
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSize();
                          }
                        }}
                        onBlur={addSize}
                        placeholder="+ tamanho"
                        aria-label="Adicionar tamanho"
                        className="w-24 px-2.5 py-1.75 rounded-[11px] ring-line text-[13px] text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-brand-light"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {editorSubcategories.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className={fieldLabelClasses}>Subcategorias</span>
                <div className="flex flex-wrap gap-1.5">
                  {editorSubcategories.map((sub) => (
                    <button key={sub.id} type="button" onClick={() => handleStartEditCategory(sub)} className="px-3 py-1.75 rounded-full bg-brand-soft text-[13px] font-semibold text-brand cursor-pointer hover:bg-brand hover:text-white transition-colors duration-150">
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {editingCategory && !editingCategory.parent_id && (
              <button type="button" onClick={() => resetCategoryForm(editingCategory.id)} className="self-start text-[13px] text-slate-500 underline hover:text-slate-900 cursor-pointer">
                + nova subcategoria
              </button>
            )}

            <Button type="submit" size="lg" isLoading={isPending} fullWidth>
              {editingCatId ? "Salvar categoria" : "Adicionar categoria"}
            </Button>
          </form>
        </section>

        {/* Bairros */}
        <section className={cardClasses} aria-label="Bairros">
          <div className="flex items-center justify-between px-1 pb-2">
            <h2 className={cardHeading}>Bairros</h2>
          </div>
          <form onSubmit={handleSaveNeighborhood} className="flex gap-2 pb-2">
            <input
              aria-label="Nome do bairro"
              placeholder={editingNbId ? "Renomear bairro" : "Novo bairro"}
              value={nbName}
              onChange={(e) => setNbName(e.target.value)}
              className="flex-1 min-w-0 h-10 rounded-xl bg-white border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand-light/25"
            />
            <button type="submit" aria-label={editingNbId ? "Salvar bairro" : "Adicionar bairro"} className={plusButton}>
              {editingNbId ? <Check className="w-4 h-4" strokeWidth={2.4} /> : <Plus className="w-4 h-4" strokeWidth={2.4} />}
            </button>
          </form>
          {neighborhoods.map((nb, idx) => {
            const visible = nb.is_active ?? true;
            return (
              <div key={nb.id} className={cn("flex items-center justify-between gap-2 py-2 px-1.5 text-sm", idx > 0 && "border-t border-slate-100", !visible && "text-slate-400")}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingNbId(nb.id);
                    setNbName(nb.name);
                    setNbIsActive(visible);
                  }}
                  className="font-semibold text-left truncate cursor-pointer hover:underline"
                >
                  {nb.name}
                </button>
                <Switch size="sm" checked={visible} onCheckedChange={() => handleToggleNeighborhoodActive(nb)} aria-label={`Bairro ${nb.name} visível`} />
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
