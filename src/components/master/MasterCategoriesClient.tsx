"use client";

import React, { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { upsertGlobalCategoryAction } from "@/app/actions/master";
import { cn, sanitizeStoreSlug } from "@/lib/utils";
import type { GlobalCategory } from "@/types/marketplace";

export interface MasterCategoriesClientProps {
  initialCategories: GlobalCategory[];
}

export function MasterCategoriesClient({
  initialCategories,
}: MasterCategoriesClientProps) {
  const [categories, setCategories] =
    useState<GlobalCategory[]>(initialCategories);
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
          ? `Categoria "${trimmedName}" atualizada com sucesso!`
          : `Nova categoria "${trimmedName}" criada com sucesso!`
      );
      if (!editingCatId) resetCategoryForm(catParentId);
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
        filter_config: cat.filter_config || {},
      });
      notify(
        nextActive
          ? `Categoria "${cat.name}" ativada!`
          : `Categoria "${cat.name}" desativada do portal.`
      );
    });
  };

  const handleMoveOrder = (cat: GlobalCategory, direction: "up" | "down") => {
    const siblings = categories
      .filter((c) =>
        cat.parent_id ? c.parent_id === cat.parent_id : !c.parent_id
      )
      .sort((a, b) => a.order_index - b.order_index);

    const currentIndex = siblings.findIndex((s) => s.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetSibling = siblings[targetIndex];
    const newCurrentOrder = targetSibling.order_index;
    const newTargetOrder = cat.order_index;

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === cat.id) return { ...c, order_index: newCurrentOrder };
        if (c.id === targetSibling.id)
          return { ...c, order_index: newTargetOrder };
        return c;
      })
    );

    startTransition(async () => {
      await Promise.all([
        upsertGlobalCategoryAction({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parent_id: cat.parent_id,
          order_index: newCurrentOrder,
          is_active: cat.is_active,
          filter_config: cat.filter_config || {},
        }),
        upsertGlobalCategoryAction({
          id: targetSibling.id,
          name: targetSibling.name,
          slug: targetSibling.slug,
          parent_id: targetSibling.parent_id,
          order_index: newTargetOrder,
          is_active: targetSibling.is_active,
          filter_config: targetSibling.filter_config || {},
        }),
      ]);
      notify(`Ordem de "${cat.name}" atualizada!`);
    });
  };

  return (
    <div className="flex flex-col gap-5 lg:gap-6 pb-12">
      {/* Toast Notification Flat */}
      <div aria-live="polite" className="empty:hidden">
        {toast && (
          <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-3.5 py-2.5 text-xs font-semibold border border-slate-800 animate-slide-up flex items-center gap-2">
            <span>{toast}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink font-display text-[11px] font-bold">
            Taxonomia Global
          </span>
          <span className="text-xs text-slate-400">Portal Bom Jesus da Lapa</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
          Categorias & Filtros
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl">
          Organize os departamentos do marketplace, subcategorias e configure atributos dinâmicos (tamanho, gênero e voltagem).
        </p>
      </div>

      {/* Layout de 2 Colunas Amplo: Lista de Categorias (Esquerda) + Editor (Direita) Flat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* COLUNA ESQUERDA: LISTA DE CATEGORIAS GLOBAIS (5 colunas) */}
        <section
          aria-label="Lista de categorias"
          className="lg:col-span-5 rounded-2xl bg-white p-4 border border-slate-200/80 flex flex-col gap-3.5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-slate-900">
                Categorias Principais
              </h2>
              <p className="text-xs text-slate-500">
                {mainCategories.length} categorias cadastradas
              </p>
            </div>
            <button
              type="button"
              onClick={() => resetCategoryForm("")}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-brand hover:text-white text-slate-800 grid place-items-center transition-colors cursor-pointer"
              title="Criar nova categoria principal"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[calc(100vh-14rem)] overflow-y-auto no-scrollbar pr-1">
            {mainCategories.map((cat, idx) => {
              const subs = getSubcategories(cat.id);
              const isSelected = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={cn(
                    "rounded-xl p-2.5 border transition-all flex flex-col gap-2",
                    isSelected
                      ? "bg-brand-soft/40 border-brand"
                      : "bg-slate-50/70 border-slate-200/70 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditCategory(cat)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <h3 className="font-display text-xs font-bold text-slate-900 truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {subs.length} {subs.length === 1 ? "subcategoria" : "subcategorias"}
                      </p>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Ordenação */}
                      <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-lg p-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveOrder(cat, "up")}
                          className="w-4.5 h-4.5 grid place-items-center text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === mainCategories.length - 1}
                          onClick={() => handleMoveOrder(cat, "down")}
                          className="w-4.5 h-4.5 grid place-items-center text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Ativa/Inativa */}
                      <Switch
                        size="sm"
                        checked={cat.is_active}
                        onCheckedChange={() => handleToggleCategoryActive(cat)}
                        aria-label={`Ativar ou pausar categoria ${cat.name}`}
                      />
                    </div>
                  </div>

                  {/* Subcategorias Indentadas */}
                  {subs.length > 0 && (
                    <div className="pl-2.5 border-l-2 border-slate-200/80 pt-1 flex flex-wrap gap-1">
                      {subs.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleStartEditCategory(sub)}
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                            editingCatId === sub.id
                              ? "bg-brand text-white"
                              : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/80"
                          )}
                        >
                          {sub.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => resetCategoryForm(cat.id)}
                        className="px-1.5 py-0.5 rounded-lg text-xs font-semibold text-brand hover:underline cursor-pointer"
                      >
                        + Subcategoria
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* COLUNA DIREITA: EDITOR DE CATEGORIA (7 colunas) Flat */}
        <section
          aria-label="Editor de categoria"
          className="lg:col-span-7 rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80"
        >
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {editingCatId ? "Modo Edição" : "Nova Categoria"}
              </span>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                {editingCatId ? `Editando: ${catName}` : "Criar Nova Categoria"}
              </h2>
            </div>
            {editingCatId && (
              <button
                type="button"
                onClick={() => resetCategoryForm("")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar edição
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Nome da categoria"
                placeholder="Ex: Moda Feminina, Calçados..."
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  if (!editingCatId) {
                    setCatSlug(sanitizeStoreSlug(e.target.value));
                  }
                }}
                required
              />

              <Input
                label="Slug (URL amigável)"
                placeholder="ex: moda-feminina"
                value={catSlug}
                onChange={(e) => setCatSlug(sanitizeStoreSlug(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Select
                label="Categoria Pai"
                value={catParentId}
                onChange={(e) => setCatParentId(e.target.value)}
                options={[
                  { value: "", label: "Nenhuma (Categoria Principal)" },
                  ...mainCategories
                    .filter((c) => c.id !== editingCatId)
                    .map((c) => ({ value: c.id, label: c.name })),
                ]}
              />

              <Input
                type="number"
                label="Ordem de exibição"
                value={catOrderIndex}
                onChange={(e) => setCatOrderIndex(Number(e.target.value))}
                min={1}
              />
            </div>

            {/* Ativa no marketplace */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-900">
                  Ativa no marketplace
                </span>
                <span className="text-[11px] text-slate-500">
                  Aparece nas buscas, filtros da Home e cadastro de produtos
                </span>
              </div>
              <Switch
                size="sm"
                checked={catIsActive}
                onCheckedChange={setCatIsActive}
                aria-label="Ativar categoria no marketplace"
              />
            </div>

            {/* Bloco de Atributos de Filtro (somente para categorias principais) */}
            {!catParentId && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand" />
                  <h3 className="font-display text-xs font-bold text-slate-900">
                    Atributos de Filtro desta Categoria
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Quando o lojista cadastrar um produto nesta categoria, estes campos adicionais serão exibidos:
                </p>

                <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">Gênero</span>
                      <span className="text-[11px] text-slate-500">
                        Opções: Masculino, Feminino, Unissex, Infantil
                      </span>
                    </div>
                    <Switch
                      size="sm"
                      checked={hasGender}
                      onCheckedChange={setHasGender}
                      aria-label="Habilitar filtro de gênero"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">Tamanho</span>
                      <span className="text-[11px] text-slate-500">
                        Grade de tamanhos nos produtos
                      </span>
                    </div>
                    <Switch
                      size="sm"
                      checked={hasSize}
                      onCheckedChange={setHasSize}
                      aria-label="Habilitar filtro de tamanho"
                    />
                  </div>

                  {hasSize && (
                    <div className="pt-1.5">
                      <Input
                        label="Opções de Tamanho (separadas por vírgula)"
                        placeholder="Ex: PP, P, M, G, GG ou 36, 37, 38, 39, 40"
                        value={sizeOptionsText}
                        onChange={(e) => setSizeOptionsText(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">Voltagem</span>
                      <span className="text-[11px] text-slate-500">
                        Opções: 110V, 220V, Bivolt
                      </span>
                    </div>
                    <Switch
                      size="sm"
                      checked={hasVoltage}
                      onCheckedChange={setHasVoltage}
                      aria-label="Habilitar filtro de voltagem"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isPending}
                className="w-full sm:w-auto text-xs"
              >
                {isPending
                  ? "Salvando..."
                  : editingCatId
                  ? "Atualizar Categoria"
                  : "Criar Categoria"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
