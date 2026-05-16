import type { ReactNode } from "react";
import { AdminAuthGate } from "@/app/admin/_components/AdminAuthGate";
import { ManagerHubNav } from "./_components/ManagerHubNav";

export const dynamic = "force-dynamic";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGate requireSuperadmin>
      <ManagerHubNav />
      {children}
    </AdminAuthGate>
  );
}
