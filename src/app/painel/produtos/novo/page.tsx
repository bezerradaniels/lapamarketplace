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
  // Logo após o cadastro da loja a categoria escolhida vem na URL
  // (vale mesmo antes da coluna `stores.global_category_id` existir no banco)
  const categoriaParam =
    typeof resolvedParams?.categoria === "string" ? resolvedParams.categoria : null;

  const { store, categories } = await fetchMerchantDashboardData();

  return (
    <ProductFormClient
      storeId={store.id}
      categories={categories}
      showOnboardingSuccess={showOnboardingSuccess}
      defaultCategoryId={store.global_category_id || categoriaParam}
    />
  );
}
