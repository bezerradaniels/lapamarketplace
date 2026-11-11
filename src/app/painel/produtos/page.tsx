import React from "react";
import { fetchMerchantDashboardData } from "@/lib/panel-data";
import { MerchantProductsListClient } from "@/components/painel/MerchantProductsListClient";

export default async function PainelProdutosPage() {
  const { products, categories } = await fetchMerchantDashboardData();

  return (
    <MerchantProductsListClient
      initialProducts={products}
      categories={categories}
    />
  );
}

