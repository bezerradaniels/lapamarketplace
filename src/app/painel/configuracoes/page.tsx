import React from "react";
import { fetchMerchantDashboardData } from "@/lib/panel-data";
import { StoreSettingsClient } from "@/components/painel/StoreSettingsClient";

export default async function PainelConfiguracoesPage() {
  const { store, neighborhoods, categories } = await fetchMerchantDashboardData();

  // Categoria da loja: só as principais (sem pai) e ativas
  const storeCategories = categories
    .filter((c) => !c.parent_id && c.is_active)
    .sort((a, b) => a.order_index - b.order_index)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <StoreSettingsClient
      initialStore={store}
      neighborhoods={neighborhoods}
      storeCategories={storeCategories}
    />
  );
}
