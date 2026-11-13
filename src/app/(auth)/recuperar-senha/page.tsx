"use client";

import { trackEvent } from "@/lib/analytics";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
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
        trackEvent("password_reset_request");
        setSuccessMessage(result.message);
      }
    });
  };

  return (
    <div className="my-auto flex flex-col gap-5.5">
      <Link
        href="/login"
        aria-label="Voltar para entrar"
        className="w-10.5 h-10.5 rounded-[14px] bg-white grid place-items-center text-slate-900 transition-transform duration-150 active:scale-95"
      >
        <ChevronLeft className="w-4.5 h-4.5" strokeWidth={2} />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05] text-slate-900">
          Esqueceu a senha?
        </h1>
        <p className="text-[15px] text-slate-500 leading-[1.45]">
          Sem problema. Mandamos um link para você criar uma nova.
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5.5">
        <Input
          name="email"
          type="email"
          label="E-mail da conta"
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isPending}
        >
          {successMessage ? "Enviar de novo" : "Enviar link"}
        </Button>
      </form>

      {successMessage && (
        <Notice tone="success" title="Link enviado!">
          {successMessage}
        </Notice>
      )}


      <p className="self-center text-sm text-slate-500">
        Lembrou?{" "}
        <Link
          href="/login"
          className="font-semibold text-slate-900 underline decoration-brand decoration-2 underline-offset-4"
        >
          Voltar para entrar
        </Link>
      </p>
    </div>
  );
}
