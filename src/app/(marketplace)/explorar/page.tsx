import React from "react";
import type { Metadata } from "next";
import { searchMarketplaceProducts } from "@/app/actions/feed";
import { ExploreMarketplaceClient } from "@/components/marketplace/ExploreMarketplaceClient";

export const metadata: Metadata = {
  title: "Explorar Produtos e Lojas | LapaShop - Bom Jesus da Lapa",
  description:
    "Busque roupas, calçados, celulares e utilidades nas lojas físicas de Bom Jesus da Lapa com filtros de tamanho, bairro, lojas abertas agora e formas de pagamento.",
};

interface ExplorePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getStr(val: string | string[] | undefined): string | undefined {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val[0];
  return undefined;
}

export default async function ExplorarPage({ searchParams }: ExplorePageProps) {
  const sp = await searchParams;

  // Carrega todos os produtos ativos do catálogo para permitir filtragem instantânea + SSR
  const { products, categories, neighborhoods, savedProductIds } =
    await searchMarketplaceProducts({});

  return (
    <ExploreMarketplaceClient
      allProducts={products}
      categories={categories}
      neighborhoods={neighborhoods}
      savedProductIds={savedProductIds}
      initialParams={{
        q: getStr(sp.q),
        categoria: getStr(sp.categoria),
        subcategoria: getStr(sp.subcategoria),
        bairro: getStr(sp.bairro),
        tamanho: getStr(sp.tamanho),
        genero: getStr(sp.genero),
        voltagem: getStr(sp.voltagem),
        condicao: getStr(sp.condicao),
        pagamento: getStr(sp.pagamento),
        precoMax: getStr(sp.precoMax),
        abertas: getStr(sp.abertas) === "true",
        promocao: getStr(sp.promocao) === "true",
      }}
    />
  );
}

