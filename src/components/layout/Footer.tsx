import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LAPA_NEIGHBORHOODS } from "./MarketplaceHeader";
import { LapaSymbol, LapaWordmark } from "@/components/brand/LapaSymbol";

const footerHeadingClasses =
  "font-sans text-xs font-semibold uppercase tracking-[0.08em] text-slate-500";

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
  { label: "Pix" },
  { label: "Crédito" },
  { label: "Débito" },
  { label: "Crediário da loja" },
  { label: "Dinheiro" },
  { label: "Boleto" },
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
        "w-full bg-white mt-10 md:mt-16 rounded-t-[28px] pb-28 md:pb-0",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
        {/* CTA para lojistas locais */}
        <div className="rounded-[28px] bg-brand-soft p-5 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-3 max-w-xl">
            <LapaSymbol size={36} />
            <h2 className="text-xl sm:text-[26px] font-extrabold tracking-[-0.02em] leading-[1.15] text-slate-900 text-balance">
              Tem uma loja em Lapa? Crie seu catálogo grátis.
            </h2>
            <p className="text-sm text-slate-700 leading-normal">
              Mostre seus produtos na vitrine da cidade, publique stories e
              receba pedidos prontos direto no seu WhatsApp.
            </p>
          </div>

          <Link
            href="/lojista/cadastro"
            className="shrink-0 inline-flex items-center h-11.5 px-4.5 rounded-[15px] bg-slate-900 hover:bg-slate-800 text-white font-display text-sm font-bold transition duration-150 active:scale-[0.98]"
          >
            Quero abrir minha loja
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sobre */}
          <div className="space-y-4">
            <Link href="/" aria-label="Lapa Marketplace — início">
              <LapaWordmark symbolSize={30} />
            </Link>
            <p className="text-[13px] text-slate-500 leading-normal">
              O marketplace do comércio de Bom Jesus da Lapa - BA. Conectando
              moradores e romeiros às lojas físicas da cidade, com pedido
              rápido pelo WhatsApp.
            </p>
          </div>

          {/* Categorias */}
          <div className="space-y-3">
            <h3 className={footerHeadingClasses}>Categorias</h3>
            <ul className="space-y-2">
              {FOOTER_CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={cat.href}
                    className="text-[13px] text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bairros (SEO local) */}
          <div className="space-y-3">
            <h3 className={footerHeadingClasses}>Lojas por bairro</h3>
            <div className="flex flex-wrap gap-1.5">
              {neighborhoods.map((bairro) => (
                <Link
                  key={bairro}
                  href={`/?bairro=${encodeURIComponent(bairro)}`}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 px-2.75 py-1.5 text-xs font-semibold transition-colors"
                >
                  {bairro}
                </Link>
              ))}
            </div>
          </div>

          {/* Pagamento */}
          <div className="space-y-3">
            <h3 className={footerHeadingClasses}>Pagamento nas lojas</h3>
            <p className="text-[13px] text-slate-500 leading-normal">
              Combine o pagamento direto com a loja, pelo WhatsApp ou na
              entrega:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_FLAGS.map((flag) => (
                <span
                  key={flag.label}
                  className="rounded-full bg-slate-100 text-slate-900 px-2.75 py-1.5 text-xs font-semibold"
                >
                  {flag.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Lapa Marketplace · Bom Jesus da Lapa,
            Bahia.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-slate-900">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="hover:text-slate-900">
              Privacidade
            </Link>
            <Link
              href="/lojista"
              className="font-semibold text-slate-900 underline decoration-brand decoration-2 underline-offset-4"
            >
              Área do lojista
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
