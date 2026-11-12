import React from "react";
import { fetchMasterDashboardData } from "@/lib/panel-data";
import { MasterDashboardClient } from "@/components/master/MasterDashboardClient";

export default async function MasterDashboardPage() {
  const data = await fetchMasterDashboardData();

  return <MasterDashboardClient data={data} />;
}


