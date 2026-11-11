"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Store, X, Sparkles, ArrowRight } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Ícone e Título */}
        <div className="text-center space-y-2 pt-1">
          <div
            className={`w-13 h-13 rounded-2xl mx-auto flex items-center justify-center ${
              isFollow
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-500"
            }`}
          >
            {isFollow ? (
              <Store className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Heart className="w-6 h-6 fill-current" aria-hidden="true" />
            )}
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
            <Sparkles
              className="w-3 h-3 text-emerald-600"
              aria-hidden="true"
            />
            Acesso rápido em 1 clique
          </span>

          <h2
            id="auth-prompt-title"
            className="text-xl font-extrabold text-slate-900 tracking-tight"
          >
            {isFollow
              ? "Entre para seguir esta loja"
              : "Salve esta peça nos seus Favoritos ❤️"}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
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
            className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 text-center"
          >
            {error}
          </p>
        )}

        {/* Botão 1 Clique Google */}
        <div className="space-y-3">
          <GoogleOAuthButton
            accountType="customer"
            nextPath="/minha-conta"
            label="Entrar com 1 clique pelo Google"
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
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Criar conta
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Você continua livre para usar a Sacola e pedir no WhatsApp sem precisar
          de conta.
        </p>
      </div>
    </div>
  );
}

