"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/app/(auth)/actions";

export default function RecuperarSenhaPage() {
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await requestPasswordReset(formData);
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
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
          <KeyRound className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Recuperar minha senha
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Informe o e-mail da sua conta e enviaremos um link seguro para você
          criar uma nova senha.
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
      {successMessage ? (
        <div
          role="status"
          className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-3"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-extrabold text-emerald-950">
            E-mail enviado!
          </h2>
          <p className="text-xs text-emerald-800 leading-relaxed">
            {successMessage}
          </p>
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSuccessMessage("")}
            >
              Tentar outro e-mail
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="email"
            type="email"
            label="E-mail cadastrado"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            required
            leftIcon={<Mail className="w-4 h-4" aria-hidden="true" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isPending}
            rightIcon={<Send className="w-4 h-4" aria-hidden="true" />}
          >
            Enviar link de recuperação
          </Button>
        </form>
      )}

      {/* Voltar para Login */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Voltar para o login</span>
        </Link>
      </div>
    </div>
  );
}

