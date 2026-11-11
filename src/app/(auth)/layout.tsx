import React from "react";
import Link from "next/link";
import { Store, ArrowLeft, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Topo Minimalista com Voltar para a Vitrine e Logo */}
      <header className="w-full py-5 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-full border border-slate-100 shadow-2xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Voltar para a vitrine</span>
          </Link>

          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Store className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="leading-none text-left">
              <span className="block text-base font-extrabold text-slate-900 tracking-tight">
                Lapa<span className="text-emerald-600">Shop</span>
              </span>
              <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Bom Jesus da Lapa
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Conteúdo Centralizado */}
      <main className="flex-1 flex flex-col justify-center px-4 py-6 sm:py-10">
        {children}
      </main>

      {/* Rodapé de Confiança */}
      <footer className="py-5 px-4 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <ShieldCheck
            className="w-4 h-4 text-emerald-600 shrink-0"
            aria-hidden="true"
          />
          <span>
            Ambiente seguro • Marketplace Oficial de Bom Jesus da Lapa - BA
          </span>
        </p>
      </footer>
    </div>
  );
}

