import React from "react";
import { fetchMasterPortalData } from "@/lib/panel-data";
import { MasterCategoriesClient } from "@/components/master/MasterCategoriesClient";

export default async function MasterCategoriasPage() {
  const { categories } = await fetchMasterPortalData();

  return <MasterCategoriesClient initialCategories={categories} />;
}

