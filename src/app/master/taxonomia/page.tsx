import React from "react";
import { fetchMasterPortalData } from "@/lib/panel-data";
import { MasterTaxonomyClient } from "@/components/master/MasterTaxonomyClient";

export default async function MasterTaxonomiaPage() {
  const { categories, neighborhoods } = await fetchMasterPortalData();

  return (
    <MasterTaxonomyClient
      initialCategories={categories}
      initialNeighborhoods={neighborhoods}
    />
  );
}

