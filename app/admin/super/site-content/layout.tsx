import type { ReactNode } from "react";
import { AdminAuthGate } from "@/app/admin/_components/AdminAuthGate";

/** Parent layout gates manager+; this restricts site content (including massage team) to superadmin. */
export default function SiteContentLayout({ children }: { children: ReactNode }) {
  return <AdminAuthGate requireMinRole="superadmin">{children}</AdminAuthGate>;
}
