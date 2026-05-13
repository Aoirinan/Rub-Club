"use client";

/**
 * Lightweight typed wrapper over GA4 / GTM dataLayer.
 * No-ops when GA isn't configured or when running on the server.
 */

type EventParams = Record<string, string | number | boolean | null | undefined>;

type GtagFn = (
  command: "event" | "config" | "set" | "js" | "consent",
  ...rest: unknown[]
) => void;

type WindowWithGtag = Window & {
  gtag?: GtagFn;
  dataLayer?: unknown[];
};

export function track(event: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as WindowWithGtag;
    if (typeof w.gtag === "function") {
      w.gtag("event", event, params);
      return;
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event, ...params });
    }
  } catch {
    /* analytics must never break the page */
  }
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GTM_ID,
  );
}
