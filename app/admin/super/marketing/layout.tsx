import type { ReactNode } from "react";
import { AdminAuthGate } from "@/app/admin/_components/AdminAuthGate";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <AdminAuthGate requireMinRole="superadmin">{children}</AdminAuthGate>;
}
