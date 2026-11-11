import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductDetailBySlugs } from "@/app/actions/feed";
import { ProductDetailClient } from "@/components/marketplace/ProductDetailClient";
import { formatCurrencyBRL } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ storeSlug: string; productSlug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { storeSlug, productSlug } = await params;
  const data = await getProductDetailBySlugs(storeSlug, productSlug);

  if (!data) {
    return {
      title: "Produto não encontrado | LapaShop",
    };
  }

  const { product, store } = data;
  const effectivePrice =
    product.promotional_price != null &&
    product.promotional_price < product.price
      ? product.promotional_price
      : product.price;

  const title = `${product.title} por ${formatCurrencyBRL(effectivePrice)} | ${
    store.name
  } em Bom Jesus da Lapa`;
  const description =
    product.description ||
    `Compre ${product.title} na loja ${store.name} (${store.neighborhood}, Bom Jesus da Lapa). Peça pelo WhatsApp ou adicione à sacola!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { storeSlug, productSlug } = await params;
  const data = await getProductDetailBySlugs(storeSlug, productSlug);

  if (!data) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={data.product}
      store={data.store}
      relatedProducts={data.relatedProducts}
      initialIsSaved={data.isSaved}
    />
  );
}

