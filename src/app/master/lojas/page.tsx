import React from "react";
import { fetchMasterPortalData } from "@/lib/panel-data";
import { MasterStoresClient } from "@/components/master/MasterStoresClient";

export default async function MasterLojasPage() {
  const { stores } = await fetchMasterPortalData();

  return <MasterStoresClient initialStores={stores} />;
}

