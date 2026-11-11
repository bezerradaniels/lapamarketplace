"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  Layers,
  MapPin,
  Plus,
  Pencil,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Check,
  SlidersHorizontal,
  FolderTree,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const [activeTab, setActiveTab] = useState<"categories" | "neighborhoods">(
    "categories"
  );
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

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Seletor de Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Taxonomia: Categorias Globais, Filtros & Bairros
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure os filtros condicionais por categoria (`filter_config`) e
            os bairros oficiais de Bom Jesus da Lapa.
          </p>
        </div>

        <div className="inline-flex items-center rounded-full bg-white p-1.5 border border-slate-100 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "categories"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Categorias & Filtros ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("neighborhoods")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "neighborhoods"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Bairros de Lapa ({neighborhoods.length})</span>
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>{toast}</span>
        </div>
      )}

      {/* =========================================================
          ABA 1: CATEGORIAS GLOBAIS, SUBCATEGORIAS & FILTER_CONFIG
         ========================================================= */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Formulário de Criação/Edição */}
          <form
            onSubmit={handleSaveCategory}
            className="lg:col-span-5 rounded-3xl bg-white p-6 border border-slate-100 shadow-xs space-y-5 lg:sticky lg:top-24"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {editingCatId
                      ? "Editar Categoria / Subcategoria"
                      : "Nova Categoria ou Subcategoria"}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tabela `public.global_categories`
                  </p>
                </div>
              </div>

              {editingCatId && (
                <button
                  type="button"
                  onClick={() => resetCategoryForm()}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>

            <Select
              label="Tipo / Categoria Pai (`parent_id`)"
              value={catParentId}
              onChange={(e) => setCatParentId(e.target.value)}
              options={[
                {
                  value: "",
                  label: "🌟 Categoria Principal (Raiz - Possui Filtros)",
                },
                ...mainCategories.map((mc) => ({
                  value: mc.id,
                  label: `↳ Subcategoria de: ${mc.name}`,
                })),
              ]}
            />

            <Input
              label="Nome da Categoria"
              placeholder="Ex: Moda & Roupas ou Vestidos"
              value={catName}
              onChange={(e) => {
                setCatName(e.target.value);
                if (!editingCatId) {
                  setCatSlug(sanitizeStoreSlug(e.target.value));
                }
              }}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Slug da URL"
                placeholder="moda-roupas"
                value={catSlug}
                onChange={(e) => setCatSlug(sanitizeStoreSlug(e.target.value))}
              />

              <Input
                label="Ordem (`order_index`)"
                type="number"
                min={1}
                value={String(catOrderIndex)}
                onChange={(e) =>
                  setCatOrderIndex(Number(e.target.value) || 1)
                }
              />
            </div>

            {/* Configuração de Filtros Condicionais (Apenas para Categoria Principal) */}
            {!catParentId && (
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3.5">
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    Filtros Condicionais do Lojista (`filter_config`)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Define quais seletores aparecem automaticamente ao cadastrar
                    produtos nesta categoria.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasGender}
                      onChange={(e) => setHasGender(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span>
                      Exigir Gênero (`has_gender`: Feminino, Masculino, Unissex,
                      Infantil)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSize}
                      onChange={(e) => setHasSize(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span>
                      Exigir Grade de Tamanhos / Numeração (`has_size`)
                    </span>
                  </label>

                  {hasSize && (
                    <div className="pl-6 pt-1 space-y-1.5">
                      <Input
                        label="Opções de Tamanho (`size_options` separadas por vírgula)"
                        placeholder="PP, P, M, G, GG ou 34, 35, 36, 37, 38..."
                        value={sizeOptionsText}
                        onChange={(e) => setSizeOptionsText(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {sizeOptionsText
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((pill) => (
                            <span
                              key={pill}
                              className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-extrabold text-slate-700"
                            >
                              {pill}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVoltage}
                      onChange={(e) => setHasVoltage(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span>
                      Exigir Voltagem (`has_voltage`: 220V, 110V, Bivolt)
                    </span>
                  </label>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer px-1">
              <input
                type="checkbox"
                checked={catIsActive}
                onChange={(e) => setCatIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span>Categoria ativa no Marketplace (`is_active = true`)</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isPending}
              leftIcon={
                editingCatId ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )
              }
            >
              {editingCatId
                ? "Salvar Alterações da Categoria"
                : "Criar Categoria / Subcategoria"}
            </Button>
          </form>

          {/* Coluna Direita: Árvore de Categorias Principais & Subcategorias */}
          <div className="lg:col-span-7 space-y-4">
            {mainCategories.map((mainCat) => {
              const subs = getSubcategories(mainCat.id);
              const fc = mainCat.filter_config || {};

              return (
                <div
                  key={mainCat.id}
                  className={cn(
                    "rounded-3xl bg-white p-5 sm:p-6 border shadow-xs space-y-4 transition-opacity",
                    mainCat.is_active
                      ? "border-slate-100"
                      : "border-slate-200 opacity-65"
                  )}
                >
                  {/* Cabeçalho da Categoria Principal */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[11px] font-extrabold">
                          #{mainCat.order_index}
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                          {mainCat.name}
                        </h3>
                        <span className="text-xs font-mono text-slate-400">
                          /{mainCat.slug}
                        </span>
                      </div>

                      {/* Badges de `filter_config` */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {fc.has_gender && (
                          <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
                            Gênero Ativo
                          </span>
                        )}
                        {fc.has_size && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Tamanhos:{" "}
                            {(fc.size_options || []).slice(0, 6).join(", ")}
                            {(fc.size_options?.length || 0) > 6 ? "..." : ""}
                          </span>
                        )}
                        {fc.has_voltage && (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                            Voltagem (220V / 110V / Bivolt)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações da Categoria Principal */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleMoveCategoryOrder(mainCat, "up")}
                        aria-label={`Subir ordem de ${mainCat.name}`}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCategoryOrder(mainCat, "down")}
                        aria-label={`Descer ordem de ${mainCat.name}`}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditCategory(mainCat)}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={mainCat.is_active}
                        aria-label={`Ativar ou desativar ${mainCat.name}`}
                        onClick={() => handleToggleCategoryActive(mainCat)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                          mainCat.is_active ? "bg-emerald-600" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200",
                            mainCat.is_active
                              ? "translate-x-5"
                              : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Subcategorias aninhadas */}
                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        <FolderTree className="w-3.5 h-3.5" />
                        Subcategorias ({subs.length})
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          resetCategoryForm(mainCat.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Subcategoria</span>
                      </button>
                    </div>

                    {subs.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1">
                        Nenhuma subcategoria cadastrada.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200/60">
                        {subs.map((sub) => (
                          <div
                            key={sub.id}
                            className="py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-400">
                                #{sub.order_index}
                              </span>
                              <span
                                className={cn(
                                  "font-bold",
                                  sub.is_active
                                    ? "text-slate-800"
                                    : "line-through text-slate-400"
                                )}
                              >
                                {sub.name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                /{sub.slug}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(sub)}
                                className="rounded-full bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCategoryActive(sub)}
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer",
                                  sub.is_active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-200 text-slate-600"
                                )}
                              >
                                {sub.is_active ? "Ativa" : "Oculta"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 2: BAIRROS DE BOM JESUS DA LAPA (`public.neighborhoods`)
         ========================================================= */}
      {activeTab === "neighborhoods" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulário para Adicionar / Editar Bairro */}
          <form
            onSubmit={handleSaveNeighborhood}
            className="lg:col-span-4 rounded-3xl bg-white p-6 border border-slate-100 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {editingNbId ? "Editar Bairro" : "Novo Bairro em Lapa"}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tabela `public.neighborhoods`
                  </p>
                </div>
              </div>

              {editingNbId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNbId(null);
                    setNbName("");
                    setNbIsActive(true);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            <Input
              label="Nome do Bairro"
              placeholder="Ex: Residencial Bom Jesus"
              value={nbName}
              onChange={(e) => setNbName(e.target.value)}
              required
              leftIcon={<MapPin className="w-4 h-4" />}
            />

            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer px-1">
              <input
                type="checkbox"
                checked={nbIsActive}
                onChange={(e) => setNbIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span>Bairro visível para Lojistas e Clientes</span>
            </label>

            <Button
              type="submit"
              variant="whatsapp"
              size="lg"
              fullWidth
              isLoading={isPending}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {editingNbId ? "Salvar Bairro" : "Adicionar Bairro"}
            </Button>
          </form>

          {/* Lista de Bairros */}
          <div className="lg:col-span-8 rounded-3xl bg-white p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Bairros Cadastrados em Bom Jesus da Lapa ({neighborhoods.length})
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                Ativos:{" "}
                {neighborhoods.filter((n) => n.is_active !== false).length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {neighborhoods.map((nb) => {
                const active = nb.is_active !== false;
                return (
                  <div
                    key={nb.id}
                    className={cn(
                      "rounded-2xl p-4 border flex items-center justify-between gap-3 transition-colors",
                      active
                        ? "bg-slate-50/70 border-slate-100"
                        : "bg-slate-100/60 border-slate-200 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin
                        className={cn(
                          "w-4 h-4 shrink-0",
                          active ? "text-emerald-600" : "text-slate-400"
                        )}
                      />
                      <div className="truncate">
                        <p className="text-sm font-extrabold text-slate-900 truncate">
                          {nb.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          /{nb.slug || sanitizeStoreSlug(nb.name)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNbId(nb.id);
                          setNbName(nb.name);
                          setNbIsActive(active);
                        }}
                        className="rounded-full bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        aria-label={`Alternar visibilidade do bairro ${nb.name}`}
                        onClick={() => handleToggleNeighborhoodActive(nb)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                          active ? "bg-emerald-600" : "bg-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200",
                            active ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

