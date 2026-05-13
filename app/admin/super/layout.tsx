import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return children;
}
