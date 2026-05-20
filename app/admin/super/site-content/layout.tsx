import type { ReactNode } from "react";
import { AdminAuthGate } from "@/app/admin/_components/AdminAuthGate";

/** Site content and massage team editing for managers and superadmins. */
export default function SiteContentLayout({ children }: { children: ReactNode }) {
  return <AdminAuthGate requireMinRole="manager">{children}</AdminAuthGate>;
}
