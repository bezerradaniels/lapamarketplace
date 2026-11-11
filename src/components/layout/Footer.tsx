import React from "react";
import Link from "next/link";
import {
  Store,
  ArrowRight,
  QrCode,
  CreditCard,
  Banknote,
  Receipt,
  Wallet,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LAPA_NEIGHBORHOODS } from "./MarketplaceHeader";

const FOOTER_CATEGORIES = [
  { name: "Moda Feminina & Masculina", href: "/?categoria=moda" },
  { name: "Calçados & Tênis", href: "/?categoria=calcados" },
  { name: "Celulares & Acessórios", href: "/?categoria=eletronicos" },
  { name: "Perfumaria & Cosméticos", href: "/?categoria=beleza" },
  { name: "Casa, Cama & Mesa", href: "/?categoria=casa" },
  { name: "Moda Infantil & Bebê", href: "/?categoria=infantil" },
  { name: "Joias, Relógios & Óculos", href: "/?categoria=acessorios" },
  { name: "Suplementos & Fitness", href: "/?categoria=fitness" },
];

const PAYMENT_FLAGS = [
  { label: "Pix Instantâneo", icon: QrCode },
  { label: "Visa / Mastercard", icon: CreditCard },
  { label: "Elo / Hipercard", icon: CreditCard },
  { label: "Crediário Local", icon: Wallet },
  { label: "Dinheiro na Entrega", icon: Banknote },
  { label: "Boleto Bancário", icon: Receipt },
];

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const neighborhoods = LAPA_NEIGHBORHOODS.filter(
    (n) => n !== "Toda Bom Jesus da Lapa"
  );

  return (
    <footer
      className={cn(
        "w-full bg-white border-t border-slate-100 mt-16",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* CTA Banner para Lojistas Locais */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-300 px-3 py-1 text-xs font-bold">
              <Store className="w-3.5 h-3.5" aria-hidden="true" />
              Para Lojistas de Bom Jesus da Lapa
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Tem uma loja em Lapa? Crie seu catálogo grátis
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Exiba seus produtos na vitrine digital da cidade, publique stories
              em tempo real e receba pedidos prontos direto no seu WhatsApp.
            </p>
          </div>

          <Link
            href="/lojista/cadastro"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 text-sm font-bold transition-colors shadow-sm"
          >
            <span>Criar catálogo grátis</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Grid Principal de Links e SEO Local */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Coluna 1: Sobre a Plataforma */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <Store className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                Lapa<span className="text-emerald-600">Shop</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              O marketplace oficial do comércio de Bom Jesus da Lapa - BA.
              Conectando moradores e romeiros às melhores lojas físicas da
              capital baiana da fé com pedido rápido via WhatsApp.
            </p>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600 font-medium">
              <ShieldCheck
                className="w-4 h-4 text-emerald-600 shrink-0"
                aria-hidden="true"
              />
              <span>Lojas locais verificadas em Lapa - BA</span>
            </div>
          </div>

          {/* Coluna 2: Categorias Rápidas */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Categorias em Destaque
            </h3>
            <ul className="space-y-2">
              {FOOTER_CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={cat.href}
                    className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Bairros de Bom Jesus da Lapa (SEO Local) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              Lojas por Bairro em Lapa
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {neighborhoods.map((bairro) => (
                <Link
                  key={bairro}
                  href={`/?bairro=${encodeURIComponent(bairro)}`}
                  className="rounded-full bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 px-2.5 py-1 text-[11px] font-medium transition-colors"
                >
                  {bairro}
                </Link>
              ))}
            </div>
          </div>

          {/* Coluna 4: Bandeiras e Formas de Pagamento */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Formas de Pagamento nas Lojas
            </h3>
            <p className="text-xs text-slate-500">
              Combine o pagamento direto com a loja pelo WhatsApp ou na entrega:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_FLAGS.map((flag) => {
                const Icon = flag.icon;
                return (
                  <div
                    key={flag.label}
                    className="flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700"
                  >
                    <Icon
                      className="w-3.5 h-3.5 text-slate-500 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{flag.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Linha Inferior de Copyright */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} LapaShop Marketplace • Bom Jesus da
            Lapa, Bahia. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-slate-600">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-slate-600">
              Privacidade
            </Link>
            <Link href="/lojista" className="hover:text-slate-600 font-semibold text-slate-600">
              Área do Lojista
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

