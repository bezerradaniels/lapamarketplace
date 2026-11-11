import React from "react";
import { fetchMerchantDashboardData } from "@/lib/panel-data";
import { StoreSettingsClient } from "@/components/painel/StoreSettingsClient";

export default async function PainelConfiguracoesPage() {
  const { store, neighborhoods } = await fetchMerchantDashboardData();

  return (
    <StoreSettingsClient initialStore={store} neighborhoods={neighborhoods} />
  );
}

