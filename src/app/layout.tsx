import type { Metadata, Viewport } from "next";
import { Figtree, Inter_Tight } from "next/font/google";
import { FloatingBagBar } from "@/components/layout/FloatingBagBar";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lapa Marketplace | O comércio de Bom Jesus da Lapa - BA",
  description:
    "Encontre roupas, calçados, eletrônicos e ofertas das melhores lojas físicas de Bom Jesus da Lapa com pedido direto no WhatsApp.",
  applicationName: "Lapa Marketplace",
};

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${figtree.variable} ${interTight.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
        <FloatingBagBar />
        <BottomNav />
      </body>
    </html>
  );
}
