import React from "react";
import { fetchMerchantDashboardData } from "@/lib/panel-data";
import { DashboardOverviewClient } from "@/components/painel/DashboardOverviewClient";

export default async function PainelDashboardPage() {
  const { store, products } = await fetchMerchantDashboardData();

  return <DashboardOverviewClient store={store} products={products} />;
}

