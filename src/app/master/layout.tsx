import React from "react";
import { MasterShell } from "@/components/master/MasterShell";
import { requireAdminPage } from "@/lib/auth/guards";

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage("/master");

  return <MasterShell>{children}</MasterShell>;
}
