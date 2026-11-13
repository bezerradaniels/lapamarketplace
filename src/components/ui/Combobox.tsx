"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { fieldBaseClasses } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  /** Valor selecionado (`""` = nenhum). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

/** Busca sem acento e sem diferenciar maiúsculas ("sao" encontra "São Gotardo"). */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Campo com sugestões: a pessoa digita e escolhe uma das opções da lista.
 * Teclado: ↑/↓ navegam, Enter escolhe, Esc fecha.
 */
export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder,
  emptyText = "Nenhuma opção encontrada",
  className,
  "aria-invalid": ariaInvalid,
}: ComboboxProps) {
  const autoId = useId();
  const inputId = id ?? `combobox-${autoId}`;
  const listId = `${inputId}-list`;

  const selected = options.find((o) => o.value === value) ?? null;
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);

  // Valor trocado por fora (ex.: rascunho restaurado): mostra o rótulo dele
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value && selected) setQuery(selected.label);
  }
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Se o texto ainda é o rótulo escolhido, mostra a lista inteira ao abrir.
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q || (selected && query === selected.label)) return options;
    return options.filter((o) => normalize(o.label).includes(q));
  }, [options, query, selected]);

  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const scrollToIndex = (index: number) => {
    const el = listRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const next =
        (activeIndex + delta + filtered.length) % Math.max(filtered.length, 1);
      setActiveIndex(next);
      scrollToIndex(next);
    } else if (e.key === "Enter") {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        choose(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(selected?.label ?? "");
    }
  };

  const handleBlur = () => {
    // Ao sair: se o texto bate exatamente com uma opção, escolhe; senão volta ao valor atual.
    const exact = options.find((o) => normalize(o.label) === normalize(query));
    if (exact) {
      if (exact.value !== value) onChange(exact.value);
      setQuery(exact.label);
    } else {
      setQuery(selected?.label ?? "");
    }
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative lapa-aurora-glow rounded-full">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[activeIndex]
              ? `${listId}-${filtered[activeIndex].value}`
              : undefined
          }
          aria-invalid={ariaInvalid}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
            if (value) onChange("");
          }}
          onFocus={(e) => {
            e.currentTarget.select();
            setActiveIndex(
              Math.max(
                0,
                options.findIndex((o) => o.value === value)
              )
            );
            setOpen(true);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            fieldBaseClasses,
            "h-13 rounded-full pl-12 pr-5.5 text-[15px]"
          )}
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto rounded-[22px] bg-white p-1.5 shadow-menu"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">{emptyText}</li>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${option.value}`}
                  role="option"
                  aria-selected={isSelected}
                  // mousedown (antes do blur) para a escolha não se perder
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-4 py-2.75 rounded-2xl text-[15px] cursor-pointer",
                    isActive ? "bg-slate-100" : "",
                    isSelected
                      ? "font-semibold text-slate-900"
                      : "text-slate-700"
                  )}
                >
                  {option.label}
                  {isSelected && (
                    <Check
                      className="w-4 h-4 text-sky-ink shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
