import React from "react";
import { fetchMerchantDashboardData } from "@/lib/panel-data";
import { PainelShell } from "@/components/painel/PainelShell";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { store } = await fetchMerchantDashboardData();

  return <PainelShell store={store}>{children}</PainelShell>;
}

