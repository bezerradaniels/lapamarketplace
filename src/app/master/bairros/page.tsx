import React from "react";
import { fetchMasterPortalData } from "@/lib/panel-data";
import { MasterNeighborhoodsClient } from "@/components/master/MasterNeighborhoodsClient";

export default async function MasterBairrosPage() {
  const { neighborhoods } = await fetchMasterPortalData();

  return <MasterNeighborhoodsClient initialNeighborhoods={neighborhoods} />;
}

