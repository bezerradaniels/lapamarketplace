import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NoticeProps {
  tone?: "success" | "error" | "warning";
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const TONES = {
  success: {
    box: "bg-emerald-100 text-emerald-800",
    dot: "bg-whatsapp text-white",
  },
  error: { box: "bg-rose-100 text-rose-700", dot: "bg-offer text-white" },
  warning: { box: "bg-amber-100 text-amber-800", dot: "bg-amber-600 text-white" },
} as const;

/**
 * Banner de retorno (sucesso/erro/aviso): fundo suave, sem borda, raio 22.
 */
export function Notice({
  tone = "success",
  title,
  children,
  className,
}: NoticeProps) {
  const style = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 items-start p-4 rounded-[22px]",
        style.box,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex-none w-7.5 h-7.5 rounded-full grid place-items-center",
          style.dot
        )}
      >
        {tone === "success" ? (
          <Check className="w-4 h-4" strokeWidth={2.4} />
        ) : tone === "error" ? (
          <X className="w-4 h-4" strokeWidth={2.4} />
        ) : (
          <span className="font-display text-sm font-extrabold">!</span>
        )}
      </span>
      <div className="flex flex-col gap-0.75 min-w-0 self-center">
        {title && (
          <span className="font-display text-[15px] font-bold">{title}</span>
        )}
        {children && (
          <span className="text-[13px] leading-[1.4]">{children}</span>
        )}
      </div>
    </div>
  );
}
