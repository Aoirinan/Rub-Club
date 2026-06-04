export const DOMAIN_CTX_COOKIE = "rub_domain_ctx";

export type DomainContextValue = "massage" | "chiro" | "default";

/** Normalize cookie / server value to a known domain context. */
export function parseDomainContextValue(raw: string | undefined | null): DomainContextValue {
  const v = raw?.trim() ?? "";
  if (v === "massage" || v === "chiro" || v === "default") return v;
  return "default";
}

/** Read `rub_domain_ctx` in the browser (client components only). */
export function readDomainContextCookie(): DomainContextValue {
  if (typeof document === "undefined") return "default";
  const m = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${DOMAIN_CTX_COOKIE}=([^;]+)`),
  );
  const v = m?.[1] ? decodeURIComponent(m[1]) : "";
  return parseDomainContextValue(v);
}
