import React from "react";
import { fetchMerchantDashboardData } from "@/lib/panel-data";
import { ProductFormClient } from "@/components/painel/ProductFormClient";

export default async function NovoProdutoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const showOnboardingSuccess = resolvedParams?.onboarding === "success";

  const { store, categories } = await fetchMerchantDashboardData();

  return (
    <ProductFormClient
      storeId={store.id}
      categories={categories}
      showOnboardingSuccess={showOnboardingSuccess}
    />
  );
}

