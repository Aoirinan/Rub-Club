/**
 * Centralized page metadata builder.
 *
 * Next.js does NOT deep-merge nested metadata objects: when a page defines its
 * own `openGraph` or `twitter`, it fully REPLACES the value inherited from the
 * root layout (so `images`, `siteName`, etc. are dropped unless re-specified).
 * To avoid every page silently losing its `og:image` or falling back to the
 * site-wide default `twitter:title`, build page metadata through this helper so
 * the social tags are always complete and consistent.
 */
import type { Metadata } from "next";
import { siteOgImage, siteShortName } from "@/lib/site-content";

export interface PageMetadataInput {
  /**
   * The `<title>` text. The root template ("%s | Chiropractic Associates")
   * appends the brand automatically — set `brandInTitle` when `title` already
   * contains the brand to avoid duplicating it.
   */
  title: string;
  /**
   * True when `title` already includes the brand; bypasses the title template.
   * Detected automatically when the title contains the site short name — set
   * it explicitly only to force the behaviour for another brand's name.
   */
  brandInTitle?: boolean;
  description: string;
  /** This page's own path (e.g. "/services/massage") or an absolute URL. */
  path: string;
  /**
   * Canonical URL when it differs from `path` — used by the imported pages that
   * duplicate a curated page at a second URL, so search engines credit one of them.
   */
  canonical?: string;
  /** Keep this page out of search results (patient paperwork, thank-you pages). */
  noindex?: boolean;
  /** Page keywords; when omitted, the root layout keywords are inherited. */
  keywords?: string[];
  /** og/twitter title; defaults to the page title. */
  ogTitle?: string;
  /** og/twitter description; defaults to the page description. */
  ogDescription?: string;
  /** og/twitter image path; defaults to the site default OG image. */
  image?: string;
}

/**
 * Brand names that a page title may already end with — stripped from imported
 * (legacy) titles so the browser tab doesn't read
 * "… | Chiropractic Associates — Chiropractic Associates, Paris TX".
 */
const TRAILING_BRANDS = [siteShortName, "The Rub Club"] as const;

/**
 * Remove a trailing "| Brand" / "— Brand" / "- Brand" from an imported page
 * title, repeatedly (old titles sometimes stack both brands). Returns the
 * original string when nothing matches, and never returns an empty title.
 */
export function stripTrailingBrand(title: string): string {
  let out = title.trim();
  for (let pass = 0; pass < 4; pass++) {
    const before = out;
    for (const brand of TRAILING_BRANDS) {
      const re = new RegExp(`\\s*[|\\u2013\\u2014-]\\s*${escapeRegExp(brand)}\\s*$`, "i");
      const next = out.replace(re, "").trim();
      if (next) out = next;
    }
    if (out === before) break;
  }
  return out || title.trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Fallback search description for an imported page that has none stored:
 * its own first paragraph, trimmed at a word boundary. Never invents copy —
 * a manager's saved description always wins.
 */
export function descriptionFromBlocks(
  blocks: readonly { tag: string; text: string }[],
  max = 155,
): string {
  const para = blocks.find(
    (b) => b.tag.toLowerCase() === "p" && b.text.trim().length > 40,
  );
  const text = (para?.text ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, "")}…`;
}

/** True when the title already carries the site brand, so the "%s | Brand" template would repeat it. */
export function titleAlreadyBranded(title: string, brand: string = siteShortName): boolean {
  return title.toLowerCase().includes(brand.toLowerCase());
}

/** Build a complete `Metadata` object with consistent canonical, OG, and Twitter tags. */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const socialTitle = input.ogTitle ?? input.title;
  const socialDescription = input.ogDescription ?? input.description;
  const image = input.image ?? siteOgImage;
  // A title that already names the brand bypasses the "%s | Brand" template.
  const brandInTitle = input.brandInTitle ?? titleAlreadyBranded(input.title);
  return {
    title: brandInTitle ? { absolute: input.title } : input.title,
    description: input.description,
    ...(input.keywords ? { keywords: input.keywords } : {}),
    alternates: { canonical: input.canonical ?? input.path },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      siteName: siteShortName,
      locale: "en_US",
      url: input.path,
      title: socialTitle,
      description: socialDescription,
      images: [{ url: image, width: 1200, height: 630, alt: siteShortName }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [image],
    },
  };
}
