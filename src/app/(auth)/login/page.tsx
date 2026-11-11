"use client";

import React, { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
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
    <div className="w-full max-w-md mx-auto rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-6">
      {/* Cabeçalho */}
      <div className="text-center space-y-1.5">
        <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
          Bem-vindo de volta
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Entrar no Lapa Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Acesse seus favoritos, lojas seguidas ou gerencie seu catálogo.
        </p>
      </div>

      {/* Alerta de Senha Redefinida */}
      {resetSuccess && !error && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs font-medium text-emerald-800"
        >
          <CheckCircle2
            className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>
            Senha atualizada com sucesso! Agora você já pode entrar com sua nova
            senha.
          </span>
        </div>
      )}

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

      {/* Botão em Destaque: Continuar com o Google */}
      <GoogleOAuthButton
        nextPath={nextPath || undefined}
        label="Continuar com o Google"
        onError={(msg) => setError(msg)}
      />

      {/* Divisor */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-100 w-full" />
        <span className="bg-white px-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
          ou entre com seu e-mail
        </span>
        <div className="border-t border-slate-100 w-full" />
      </div>

      {/* Formulário de E-mail e Senha */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {nextPath && <input type="hidden" name="next" value={nextPath} />}

        <Input
          name="email"
          type="email"
          label="Seu e-mail"
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
          leftIcon={<Mail className="w-4 h-4" aria-hidden="true" />}
        />

        <div className="space-y-1.5">
          <Input
            name="password"
            type="password"
            label="Sua senha"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
          />
          <div className="flex justify-end px-1">
            <Link
              href="/recuperar-senha"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isPending}
          rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
        >
          Entrar na conta
        </Button>
      </form>

      {/* Link para Cadastro */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-xs sm:text-sm text-slate-600">
          Ainda não tem uma conta?{" "}
          <Link
            href={
              nextPath
                ? `/cadastro?next=${encodeURIComponent(nextPath)}`
                : "/cadastro"
            }
            className="font-extrabold text-slate-900 hover:text-emerald-600 transition-colors underline underline-offset-4"
          >
            Criar conta grátis
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
        <div className="w-full max-w-md mx-auto rounded-3xl bg-white p-8 shadow-sm border border-slate-100 animate-pulse h-120" />
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

