import React from "react";

/**
 * Fluxo de acesso: coluna única (mobile-first). No desktop a coluna fica
 * centralizada (max-w ~420px) sobre o fundo #F8FAFC.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-900">
      <main className="flex-1 flex flex-col w-full max-w-105 mx-auto px-6 pt-[max(3.5rem,env(safe-area-inset-top))] pb-7 md:py-14">
        {children}
      </main>
    </div>
  );
}
