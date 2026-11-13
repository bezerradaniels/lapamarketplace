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
import { GOOGLE_AUTH_ENABLED } from "@/lib/auth-config";
import { signupWithEmail } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { useFormDraft } from "@/lib/use-form-draft";

function SignupFormContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "";
  const tipoIntent = searchParams.get("tipo") || searchParams.get("account_type") || "";

  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Rascunho de nome e e-mail (a senha nunca é salva)
  const draft = useFormDraft(
    "signup",
    { fullName, email },
    (saved) => {
      if (saved.fullName) setFullName(saved.fullName);
      if (saved.email) setEmail(saved.email);
    },
    { ttlDays: 1 }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const formData = new FormData(e.currentTarget);
    if (tipoIntent) {
      formData.set("account_type", tipoIntent);
    }

    startTransition(async () => {
      // Sucesso pode redirecionar direto: apaga antes e salva de novo se falhar
      draft.clear();
      const result = await signupWithEmail(formData);
      if (result?.error) {
        setError(result.error);
        draft.saveNow();
      } else if (result?.success && result.message) {
        setSuccessMessage(result.message);
      }
    });
  };

  return (
    <div className="my-auto flex flex-col gap-5.5">
      <Link
        href="/"
        aria-label="Lapa Marketplace — voltar para o início"
        className="self-center"
      >
        <LapaWordmark
          variant="full"
          symbolVariant="solid"
          symbolSize={34}
          textClassName="text-[22px]"
        />
      </Link>

      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05] text-slate-900 text-balance">
          <span className="block">Seja bem-vindo.</span>
          <span className="block">
            Crie sua conta <span className="aura-text">grátis!</span>
          </span>
        </h1>
        <p className="text-[15px] text-slate-500 leading-[1.45]">
          Cadastre-se para favoritar peças, seguir lojas e agilizar seus pedidos.
        </p>
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
          <form
            id="signup-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            {tipoIntent && <input type="hidden" name="account_type" value={tipoIntent} />}

            <Input
              name="full_name"
              type="text"
              label="Nome completo"
              placeholder="Maria Silva"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              name="email"
              type="email"
              label="E-mail"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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


          <Button
            type="submit"
            form="signup-form"
            variant="blue"
            size="lg"
            fullWidth
            isLoading={isPending}
          >
            Criar conta
          </Button>

          {GOOGLE_AUTH_ENABLED && (
            <>
              <div className="flex items-center gap-3 text-[13px] text-slate-500">
                <span className="flex-1 h-px bg-slate-200" />
                ou
                <span className="flex-1 h-px bg-slate-200" />
              </div>

              <GoogleOAuthButton
                nextPath={nextPath || undefined}
                label="Continuar com o Google"
                onError={(msg) => setError(msg)}
              />
            </>
          )}
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

