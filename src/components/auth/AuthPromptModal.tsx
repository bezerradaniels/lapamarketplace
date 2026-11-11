"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { LapaSymbol } from "@/components/brand/LapaSymbol";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { Button } from "@/components/ui/Button";

export interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: "favorite" | "follow";
  itemName?: string;
}

export function AuthPromptModal({
  isOpen,
  onClose,
  reason = "favorite",
  itemName,
}: AuthPromptModalProps) {
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const isFollow = reason === "follow";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[28px] bg-white p-6 sm:p-7 shadow-float space-y-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela"
          className="absolute top-4 right-4 w-10.5 h-10.5 rounded-[14px] bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Ícone e Título */}
        <div className="space-y-2.5 pt-1">
          <span className="w-16 h-16 rounded-[22px] bg-brand-soft grid place-items-center">
            <LapaSymbol size={40} />
          </span>

          <h2
            id="auth-prompt-title"
            className="text-[22px] font-extrabold text-slate-900 tracking-[-0.02em] leading-[1.15] text-balance"
          >
            {isFollow
              ? "Entre para seguir esta loja"
              : "Entre para salvar nos favoritos"}
          </h2>

          <p className="text-sm text-slate-500 leading-normal">
            {itemName ? (
              <>
                Entre rapidinho para salvar{" "}
                <strong className="text-slate-800">{itemName}</strong> na sua
                conta e acessar quando quiser.
              </>
            ) : (
              "Crie sua conta ou entre em 1 clique para favoritar produtos, acompanhar novidades das lojas de Lapa e salvar seu endereço de entrega."
            )}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-[18px] bg-rose-100 px-4 py-3 text-[13px] font-semibold text-rose-700"
          >
            {error}
          </p>
        )}

        {/* Botão 1 Clique Google */}
        <div className="space-y-3">
          <GoogleOAuthButton
            accountType="customer"
            nextPath="/minha-conta"
            label="Continuar com o Google"
            onError={(msg) => setError(msg)}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/login?next=/minha-conta" className="block">
              <Button variant="secondary" size="md" fullWidth>
                Entrar com e-mail
              </Button>
            </Link>
            <Link
              href="/cadastro?next=/minha-conta"
              className="block"
            >
              <Button
                variant="primary"
                size="md"
                fullWidth
              >
                Criar conta
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Você continua livre para usar a Sacola e pedir no WhatsApp sem precisar
          de conta.
        </p>
      </div>
    </div>
  );
}

