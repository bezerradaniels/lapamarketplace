import React from "react";
import { fetchMerchantDashboardData } from "@/lib/panel-data";
import { ProductFormClient } from "@/components/painel/ProductFormClient";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { store, products, categories } = await fetchMerchantDashboardData();

  const matchedProduct =
    products.find((p) => p.id === id) || products[0] || null;

  return (
    <ProductFormClient
      storeId={store.id}
      categories={categories}
      initialProduct={matchedProduct}
    />
  );
}

