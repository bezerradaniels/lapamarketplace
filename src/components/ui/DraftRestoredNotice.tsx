"use client";

import React from "react";
import { RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DraftRestoredNoticeProps {
  /** Apaga o rascunho e recomeça o formulário. */
  onDiscard: () => void;
  /** Só esconde o aviso. */
  onDismiss: () => void;
  className?: string;
}

/**
 * Aviso discreto de que o formulário foi preenchido com o rascunho salvo.
 */
export function DraftRestoredNotice({
  onDiscard,
  onDismiss,
  className,
}: DraftRestoredNoticeProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-[18px] bg-sky-soft pl-4 pr-2 py-2.5 text-[13px] text-sky-ink",
        className
      )}
    >
      <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0 leading-snug">
        <strong className="font-semibold">Continuamos de onde você parou.</strong>{" "}
        <button
          type="button"
          onClick={onDiscard}
          className="underline underline-offset-2 font-semibold cursor-pointer hover:text-slate-900"
        >
          Começar do zero
        </button>
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar aviso"
        className="w-8 h-8 rounded-full grid place-items-center shrink-0 cursor-pointer hover:bg-white/60"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
