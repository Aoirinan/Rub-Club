"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

const TABS = [
  {
    href: "/admin/super",
    label: "Scheduling & team",
    match: (path: string) =>
      path === "/admin/super" || path.startsWith("/admin/super/slot-inspector"),
    capability: "operations" as const,
  },
  {
    href: "/admin/super/page-builder",
    label: "Website",
    match: (path: string) =>
      path.startsWith("/admin/super/page-builder") ||
      path.startsWith("/admin/super/site-content") ||
      path.startsWith("/admin/super/site-staff"),
    capability: "siteContent" as const,
  },
  {
    href: "/admin/super/practice-pages",
    label: "Practice pages",
    match: (path: string) => path.startsWith("/admin/super/practice-pages"),
    capability: "siteContent" as const,
  },
  {
    href: "/admin/super/marketing?tab=booking",
    label: "Promos & booking",
    match: (path: string) => path.startsWith("/admin/super/marketing"),
    capability: "marketing" as const,
  },
] as const;

type Capabilities = {
  operations: boolean;
  siteContent: boolean;
  marketing: boolean;
};

export function ManagerHubNav() {
  const pathname = usePathname() ?? "";
  const [caps, setCaps] = useState<Capabilities | null>(null);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCaps(null);
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as { capabilities?: Capabilities };
      setCaps(data.capabilities ?? { operations: true, siteContent: false, marketing: false });
    });
    return () => unsub();
  }, []);

  const visibleTabs = TABS.filter((tab) => {
    if (!caps) return tab.capability === "operations";
    return caps[tab.capability];
  });

  return (
    <nav
      aria-label="Website and manager settings"
      className="border-b border-slate-200 bg-white shadow-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-stretch gap-1 px-4 py-2">
        {visibleTabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-4 py-2.5 transition ${
                active
                  ? "bg-[#c0392b] text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="block text-sm font-bold">{tab.label}</span>
            </Link>
          );
        })}
        <Link
          href="/admin"
          className="ml-auto self-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          â† Bookings
        </Link>
      </div>
    </nav>
  );
}
