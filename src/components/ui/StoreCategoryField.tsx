"use client";

import React from "react";
import { Input, fieldLabelClasses } from "@/components/ui/Input";
import { PillGroup } from "@/components/ui/Switch";
import { STORE_CATEGORY_OTHER } from "@/lib/db-columns";

export interface StoreCategoryFieldProps {
  categories: Array<{ id: string; name: string }>;
  /** Id da categoria, `"other"` para "Outra" ou `""` (nenhuma). */
  value: string;
  onChange: (value: string) => void;
  otherText: string;
  onOtherTextChange: (text: string) => void;
  /** Fundo das pílulas inativas: `white` (sobre fundo cinza) ou `soft` (sobre card branco). */
  surface?: "white" | "soft";
}

/**
 * Categoria principal da loja: categorias do portal + "Outra" (com o nome
 * digitado). Usado no cadastro da loja e nas configurações do painel.
 */
export function StoreCategoryField({
  categories,
  value,
  onChange,
  otherText,
  onOtherTextChange,
  surface = "white",
}: StoreCategoryFieldProps) {
  const isOther = value === STORE_CATEGORY_OTHER;

  return (
    <div className="flex flex-col gap-2.5">
      <span className={fieldLabelClasses}>Categoria da loja</span>
      <PillGroup
        ariaLabel="Categoria da loja"
        surface={surface}
        value={value || null}
        onToggle={onChange}
        options={[
          ...categories.map((c) => ({ value: c.id, label: c.name })),
          { value: STORE_CATEGORY_OTHER, label: "Outra" },
        ]}
      />
      {isOther ? (
        <Input
          inputSize="md"
          label="Qual é a categoria?"
          placeholder="Ex.: Pet shop, Papelaria, Material de construção"
          maxLength={60}
          value={otherText}
          onChange={(e) => onOtherTextChange(e.target.value)}
          autoFocus
        />
      ) : (
        <span className="text-xs text-slate-500">
          O que você mais vende. Ajuda clientes a acharem sua loja.
        </span>
      )}
    </div>
  );
}
