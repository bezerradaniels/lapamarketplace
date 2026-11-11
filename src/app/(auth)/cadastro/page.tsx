"use client";

import React, { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Button,
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
} from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Notice } from "@/components/ui/Notice";
import { LapaWordmark } from "@/components/brand/LapaSymbol";
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

  const accountOptions: Array<{
    value: AccountType;
    title: string;
    sub: string;
  }> = [
    {
      value: "customer",
      title: "Quero comprar em Lapa",
      sub: "Favoritar, seguir lojas e pedir rápido",
    },
    {
      value: "merchant",
      title: "Sou lojista, quero vender",
      sub: "Catálogo grátis com pedidos no WhatsApp",
    },
  ];

  return (
    <div className="flex-1 md:flex-none md:my-auto flex flex-col gap-5.5">
      <Link href="/" aria-label="Lapa Marketplace — voltar para o início">
        <LapaWordmark variant="short" symbolSize={28} textClassName="text-xl" />
      </Link>

      <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-slate-900 text-balance">
        Como você quer usar a Lapa?
      </h1>

      {/* Tipo de conta: dois cards de escolha */}
      <div
        role="radiogroup"
        aria-label="Tipo de conta"
        className="grid grid-cols-2 gap-2.5"
      >
        {accountOptions.map((opt) => {
          const selected = accountType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setAccountType(opt.value)}
              className={cn(
                "p-3.5 rounded-[22px] flex flex-col gap-2.5 text-left cursor-pointer transition-[background-color,box-shadow] duration-150 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                selected
                  ? "bg-brand-soft shadow-[inset_0_0_0_2px_#FDBA74]"
                  : "bg-white ring-line"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "w-5.5 h-5.5 rounded-full bg-white transition-shadow duration-150",
                  selected
                    ? "shadow-[inset_0_0_0_6px_#0F172A]"
                    : "shadow-[inset_0_0_0_1.5px_#CBD5E1]"
                )}
              />
              <span className="font-display text-[15px] font-bold leading-[1.2] text-slate-900">
                {opt.title}
              </span>
              <span className="text-xs text-slate-500 leading-[1.35]">
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {successMessage ? (
        <>
          <Notice tone="success" title="Quase tudo pronto!">
            {successMessage}
          </Notice>
          <Link
            href="/login"
            className={cn(
              buttonBaseClasses,
              buttonVariantClasses.primary,
              buttonSizeClasses.lg
            )}
          >
            Ir para o login
          </Link>
        </>
      ) : (
        <>
          <GoogleOAuthButton
            accountType={accountType}
            nextPath={nextPath || undefined}
            label="Continuar com o Google"
            onError={(msg) => setError(msg)}
          />

          <form
            id="signup-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="account_type" value={accountType} />

            <Input
              name="full_name"
              type="text"
              label={
                accountType === "merchant"
                  ? "Nome do responsável pela loja"
                  : "Nome completo"
              }
              placeholder="Maria Silva"
              autoComplete="name"
              required
            />

            <Input
              name="email"
              type="email"
              label="E-mail"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />

            <PasswordInput
              name="password"
              label="Senha"
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </form>

          <div className="flex-1 md:hidden" />

          <Button
            type="submit"
            form="signup-form"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isPending}
          >
            {accountType === "merchant"
              ? "Criar conta e abrir minha loja"
              : "Criar minha conta"}
          </Button>
        </>
      )}

      <p className="self-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-slate-900 underline decoration-brand decoration-2 underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full rounded-[28px] bg-white animate-pulse h-136" />
      }
    >
      <SignupFormContent />
    </Suspense>
  );
}

