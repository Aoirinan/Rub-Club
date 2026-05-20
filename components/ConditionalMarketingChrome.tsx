"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Hide public site header/footer on admin popup routes (second-monitor scheduler). */
export function ConditionalMarketingChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const minimal = pathname.startsWith("/admin/chiro");
  if (minimal) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
