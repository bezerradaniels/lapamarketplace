"use client";

import React, { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { resendConfirmationEmail } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export interface EmailConfirmReminderProps {
  email?: string | null;
  className?: string;
}

/**
 * Lembrete para quem entrou sem confirmar o e-mail: o acesso já está
 * liberado, a confirmação pode ser feita depois.
 */
export function EmailConfirmReminder({
  email,
  className,
}: EmailConfirmReminderProps) {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleResend = () => {
    setStatus(null);
    startTransition(async () => {
      const result = await resendConfirmationEmail();
      if (result.error) {
        setStatus({ type: "error", text: result.error });
      } else if (result.message) {
        setStatus({ type: "success", text: result.message });
      }
    });
  };

  const sent = status?.type === "success";

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-[22px] bg-sky-soft p-4 text-sky-ink",
        className
      )}
    >
      <div className="flex gap-3 items-start flex-1 min-w-0">
        <span
          aria-hidden="true"
          className="flex-none w-7.5 h-7.5 rounded-full bg-aura-cyan text-white grid place-items-center"
        >
          <Mail className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div className="flex flex-col gap-0.75 min-w-0 self-center">
          <span className="font-display text-[15px] font-bold">
            Confirme seu e-mail
          </span>
          <span className="text-[13px] leading-[1.4]">
            {status?.text ?? (
              <>
                Enviamos um link para{" "}
                <strong className="font-semibold break-words">
                  {email || "o seu e-mail"}
                </strong>
                . Você já pode usar a Lapa normalmente e confirmar quando
                puder.
              </>
            )}
          </span>
        </div>
      </div>

      {!sent && (
        <button
          type="button"
          onClick={handleResend}
          disabled={isPending}
          className="h-10 px-4 rounded-full bg-white text-[13px] font-semibold text-sky-ink inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-transform duration-150 active:scale-[0.98] disabled:opacity-55"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Reenviar e-mail
        </button>
      )}
    </div>
  );
}
