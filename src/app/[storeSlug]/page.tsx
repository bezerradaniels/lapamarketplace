import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreFrontBySlug } from "@/app/actions/feed";
import { StorefrontClient } from "@/components/marketplace/StorefrontClient";

interface StorePageProps {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  const data = await getStoreFrontBySlug(storeSlug);

  if (!data) {
    return {
      title: "Loja não encontrada | LapaShop",
    };
  }

  const { store } = data;
  const title = `${store.name} (${store.neighborhood}) | Catálogo Digital em Bom Jesus da Lapa`;
  const description =
    store.description ||
    `Confira o catálogo digital oficial de ${store.name} no bairro ${store.neighborhood}, em Bom Jesus da Lapa. Peça online e receba pelo WhatsApp!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: store.banner_url
        ? [store.banner_url]
        : store.avatar_url
        ? [store.avatar_url]
        : [],
    },
  };
}

export default async function StorefrontPage({ params }: StorePageProps) {
  const { storeSlug } = await params;
  const data = await getStoreFrontBySlug(storeSlug);

  if (!data) {
    notFound();
  }

  return (
    <StorefrontClient
      store={data.store}
      products={data.products}
      storeCategories={data.storeCategories}
      initialIsFollowing={data.isFollowing}
      savedProductIds={data.savedProductIds}
    />
  );
}

