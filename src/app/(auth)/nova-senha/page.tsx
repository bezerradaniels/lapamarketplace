"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updatePassword } from "@/app/(auth)/actions";

export default function NovaSenhaPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirm_password") || "");

    if (password.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("A confirmação de senha não confere.");
      return;
    }

    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(result.redirectTo || "/minha-conta");
        }, 1500);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-6">
      {/* Cabeçalho */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Definir nova senha
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Escolha uma senha segura para proteger sua conta no Lapa Marketplace.
        </p>
      </div>

      {/* Erro */}
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

      {/* Sucesso */}
      {success ? (
        <div
          role="status"
          className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-3"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-extrabold text-emerald-950">
            Senha atualizada!
          </h2>
          <p className="text-xs text-emerald-800">
            Redirecionando você para a sua conta...
          </p>
          <Link
            href="/minha-conta"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Ir para Minha Conta
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="password"
            type="password"
            label="Nova senha"
            placeholder="Mínimo de 6 caracteres"
            autoComplete="new-password"
            minLength={6}
            required
            leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
          />

          <Input
            name="confirm_password"
            type="password"
            label="Confirme a nova senha"
            placeholder="Digite a nova senha novamente"
            autoComplete="new-password"
            minLength={6}
            required
            leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isPending}
            rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
          >
            Salvar nova senha
          </Button>
        </form>
      )}
    </div>
  );
}

