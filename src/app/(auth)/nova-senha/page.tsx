"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Notice } from "@/components/ui/Notice";
import { LapaWordmark } from "@/components/brand/LapaSymbol";
import { updatePassword } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const STRENGTH_LABELS = ["", "Senha fraca", "Senha razoável", "Senha boa", "Senha forte"];

/** Força da senha em 0–4 segmentos: tamanho, letras, números e variedade. */
function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)) {
    score += 1;
  }
  if (password.length >= 10) score += 1;
  if (/[^a-zA-Z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) {
    score += 1;
  }
  return Math.max(1, score);
}

export default function NovaSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const newPassword = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirm_password") || "");

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
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

      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05] text-slate-900">
          Crie uma nova senha
        </h1>
        <p className="text-[15px] text-slate-500 leading-[1.45]">
          Use pelo menos 8 caracteres, com letras e números.
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {success ? (
        <>
          <Notice tone="success" title="Senha atualizada!">
            Redirecionando você para a sua conta…
          </Notice>
          <Link
            href="/minha-conta"
            className="self-center text-sm font-semibold text-slate-900 underline decoration-brand decoration-2 underline-offset-4"
          >
            Ir para minha conta
          </Link>
        </>
      ) : (
        <>
          <form
            id="new-password-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-5.5"
          >
            <div className="flex flex-col gap-1.5">
              <PasswordInput
                name="password"
                label="Nova senha"
                placeholder="Sua nova senha"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby="password-strength"
              />
              <div className="grid grid-cols-4 gap-1 mt-1" aria-hidden="true">
                {[1, 2, 3, 4].map((segment) => (
                  <span
                    key={segment}
                    className={cn(
                      "h-1 rounded-full transition-colors duration-150",
                      segment <= strength
                        ? strength <= 1
                          ? "bg-offer"
                          : strength === 2
                          ? "bg-amber-600"
                          : "bg-whatsapp"
                        : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <span
                id="password-strength"
                aria-live="polite"
                className={cn(
                  "text-xs font-semibold min-h-4",
                  strength <= 1
                    ? "text-rose-700"
                    : strength === 2
                    ? "text-amber-800"
                    : "text-emerald-800"
                )}
              >
                {STRENGTH_LABELS[strength]}
              </span>
            </div>

            <PasswordInput
              name="confirm_password"
              label="Confirmar senha"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </form>


          <Button
            type="submit"
            form="new-password-form"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isPending}
          >
            Salvar e entrar
          </Button>
        </>
      )}
    </div>
  );
}
