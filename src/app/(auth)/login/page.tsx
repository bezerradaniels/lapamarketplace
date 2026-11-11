"use client";

import React, { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Notice } from "@/components/ui/Notice";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { LapaSymbol } from "@/components/brand/LapaSymbol";
import { loginWithEmail } from "@/app/(auth)/actions";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error") || "";
  const resetSuccess = searchParams.get("reset") === "success";
  const nextPath = searchParams.get("next") || "";

  const [error, setError] = useState<string>(initialError);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginWithEmail(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex-1 md:flex-none md:my-auto flex flex-col gap-5.5">
      <div className="flex flex-col gap-4.5">
        <Link
          href="/"
          aria-label="Lapa Marketplace — voltar para o início"
          className="w-16 h-16 rounded-[22px] bg-brand-soft grid place-items-center"
        >
          <LapaSymbol size={40} />
        </Link>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05] text-slate-900 text-balance">
            Bem-vindo de volta à Lapa
          </h1>
          <p className="text-[15px] text-slate-500 leading-[1.45]">
            Entre para favoritar peças, seguir lojas e agilizar seus pedidos.
          </p>
        </div>
      </div>

      {resetSuccess && !error && (
        <Notice tone="success" title="Senha atualizada!">
          Agora é só entrar com a sua nova senha.
        </Notice>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <GoogleOAuthButton
        nextPath={nextPath || undefined}
        label="Continuar com o Google"
        onError={(msg) => setError(msg)}
      />

      <div className="flex items-center gap-3 text-[13px] text-slate-500">
        <span className="flex-1 h-px bg-slate-200" />
        ou entre com seu e-mail
        <span className="flex-1 h-px bg-slate-200" />
      </div>

      <form
        id="login-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5"
      >
        {nextPath && <input type="hidden" name="next" value={nextPath} />}

        <Input
          name="email"
          type="email"
          label="E-mail"
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
        />

        <div className="relative">
          <PasswordInput
            name="password"
            label="Senha"
            placeholder="Sua senha"
            autoComplete="current-password"
            required
          />
          <Link
            href="/recuperar-senha"
            className="absolute top-0 right-0 text-[13px] text-slate-500 underline hover:text-slate-900 transition-colors"
          >
            Esqueci minha senha
          </Link>
        </div>
      </form>

      <div className="flex-1 md:hidden" />

      <div className="flex flex-col gap-4 items-center">
        <Button
          type="submit"
          form="login-form"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isPending}
        >
          Entrar
        </Button>
        <p className="text-sm text-slate-500">
          Ainda não tem conta?{" "}
          <Link
            href={
              nextPath
                ? `/cadastro?next=${encodeURIComponent(nextPath)}`
                : "/cadastro"
            }
            className="font-semibold text-slate-900 underline decoration-brand decoration-2 underline-offset-4"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full rounded-[28px] bg-white animate-pulse h-120" />
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
