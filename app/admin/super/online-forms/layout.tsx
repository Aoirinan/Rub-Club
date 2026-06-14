import type { ReactNode } from "react";
import { AdminAuthGate } from "@/app/admin/_components/AdminAuthGate";

export const dynamic = "force-dynamic";

export default function OnlineFormsAdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthGate requireMinRole="superadmin">{children}</AdminAuthGate>;
}
