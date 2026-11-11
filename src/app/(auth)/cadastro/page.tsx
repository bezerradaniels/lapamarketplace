"use client";

import React, { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  ShoppingBag,
  Store,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { signupWithEmail } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types/marketplace";

function SignupFormContent() {
  const searchParams = useSearchParams();
  const initialType =
    searchParams.get("tipo") === "merchant" ||
    searchParams.get("account_type") === "merchant"
      ? "merchant"
      : "customer";
  const nextPath = searchParams.get("next") || "";

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const formData = new FormData(e.currentTarget);
    formData.set("account_type", accountType);

    startTransition(async () => {
      const result = await signupWithEmail(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success && result.message) {
        setSuccessMessage(result.message);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-6">
      {/* Cabeçalho */}
      <div className="text-center space-y-1.5">
        <span className="inline-block rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
          Cadastro Unificado
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Crie sua conta gratuita
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Escolha como deseja usar o Lapa Marketplace em Bom Jesus da Lapa.
        </p>
      </div>

      {/* Seletor Visual em Pílulas no Topo: Cliente vs Lojista */}
      <div
        role="radiogroup"
        aria-label="Tipo de conta"
        className="grid grid-cols-2 gap-1.5 rounded-full bg-slate-100/90 p-1.5 border border-slate-200/60"
      >
        <button
          type="button"
          role="radio"
          aria-checked={accountType === "customer"}
          onClick={() => setAccountType("customer")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-full py-2.5 px-3 text-xs font-bold transition-all cursor-pointer touch-manipulation",
            accountType === "customer"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Quero Comprar em Lapa</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={accountType === "merchant"}
          onClick={() => setAccountType("merchant")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-full py-2.5 px-3 text-xs font-bold transition-all cursor-pointer touch-manipulation",
            accountType === "merchant"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Store className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Sou Lojista / Quero Vender</span>
        </button>
      </div>

      {/* Resumo Contextual da Escolha */}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-xs font-medium border transition-colors",
          accountType === "merchant"
            ? "bg-emerald-50/70 border-emerald-200/70 text-emerald-900"
            : "bg-slate-50 border-slate-200/60 text-slate-600"
        )}
      >
        {accountType === "merchant" ? (
          <span>
            <strong>Modo Lojista:</strong> Cadastre sua loja física ou online de
            Bom Jesus da Lapa, publique produtos e receba pedidos no WhatsApp.
          </span>
        ) : (
          <span>
            <strong>Modo Visitante / Morador:</strong> Salve seus produtos
            favoritos ❤️, siga lojas da cidade e preencha seu endereço em 1
            clique.
          </span>
        )}
      </div>

      {/* Alerta de Erro */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs font-medium text-rose-700"
        >
          <AlertCircle
            className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      )}

      {/* Alerta de Sucesso (Confirmação de E-mail) */}
      {successMessage ? (
        <div
          role="status"
          className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-3"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-extrabold text-emerald-950">
            Quase tudo pronto!
          </h2>
          <p className="text-xs text-emerald-800 leading-relaxed">
            {successMessage}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Ir para o Login
          </Link>
        </div>
      ) : (
        <>
          {/* Botão Google OAuth com accountType sincronizado */}
          <GoogleOAuthButton
            accountType={accountType}
            nextPath={nextPath || undefined}
            label="Continuar com o Google"
            onError={(msg) => setError(msg)}
          />

          {/* Divisor */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-100 w-full" />
            <span className="bg-white px-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
              ou cadastre-se com seu e-mail
            </span>
            <div className="border-t border-slate-100 w-full" />
          </div>

          {/* Formulário Rápido */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="account_type" value={accountType} />

            <Input
              name="full_name"
              type="text"
              label={
                accountType === "merchant"
                  ? "Seu nome ou responsável pela loja"
                  : "Seu nome completo"
              }
              placeholder="Ex: Maria Silva"
              autoComplete="name"
              required
              leftIcon={<User className="w-4 h-4" aria-hidden="true" />}
            />

            <Input
              name="email"
              type="email"
              label="Seu melhor e-mail"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
              leftIcon={<Mail className="w-4 h-4" aria-hidden="true" />}
            />

            <Input
              name="password"
              type="password"
              label="Crie uma senha"
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
              helperText="Use pelo menos 6 caracteres."
              leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
            />

            <Button
              type="submit"
              variant={accountType === "merchant" ? "whatsapp" : "primary"}
              size="lg"
              fullWidth
              isLoading={isPending}
              rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
            >
              {accountType === "merchant"
                ? "Criar conta e configurar loja"
                : "Criar minha conta grátis"}
            </Button>
          </form>
        </>
      )}

      {/* Link para Login */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-xs sm:text-sm text-slate-600">
          Já possui uma conta?{" "}
          <Link
            href="/login"
            className="font-extrabold text-slate-900 hover:text-emerald-600 transition-colors underline underline-offset-4"
          >
            Entrar agora
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto rounded-3xl bg-white p-8 shadow-sm border border-slate-100 animate-pulse h-136" />
      }
    >
      <SignupFormContent />
    </Suspense>
  );
}

