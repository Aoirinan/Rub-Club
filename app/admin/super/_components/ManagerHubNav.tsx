"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/admin/super",
    label: "Operations",
    description: "Staff, providers, massage team",
    match: (path: string) =>
      path === "/admin/super" || path.startsWith("/admin/super/slot-inspector"),
  },
  {
    href: "/admin/super/site-content",
    label: "Site content",
    description: "Page copy, photos, FAQs",
    match: (path: string) => path.startsWith("/admin/super/site-content"),
  },
  {
    href: "/admin/super/marketing",
    label: "Banners & promos",
    description: "Banner bar, pop-ups, videos",
    match: (path: string) => path.startsWith("/admin/super/marketing"),
  },
] as const;

export function ManagerHubNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Website and manager settings"
      className="border-b border-slate-200 bg-white shadow-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-stretch gap-1 px-4 py-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-4 py-2.5 transition ${
                active
                  ? "bg-[#0f5f5c] text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="block text-sm font-bold">{tab.label}</span>
              <span
                className={`mt-0.5 block text-xs font-normal ${
                  active ? "text-white/85" : "text-slate-500"
                }`}
              >
                {tab.description}
              </span>
            </Link>
          );
        })}
        <Link
          href="/admin"
          className="ml-auto self-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          ← Bookings
        </Link>
      </div>
    </nav>
  );
}
