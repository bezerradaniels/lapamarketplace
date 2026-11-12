import React from "react";
import { fetchMasterUsersData } from "@/lib/panel-data";
import { MasterUsersClient } from "@/components/master/MasterUsersClient";

export default async function MasterUsersPage() {
  const data = await fetchMasterUsersData();

  return <MasterUsersClient initialUsers={data.users} />;
}

