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
  /** True when `title` already includes the brand; bypasses the title template. */
  brandInTitle?: boolean;
  description: string;
  /** Canonical path (e.g. "/services/massage") or an absolute URL. */
  path: string;
  /** Page keywords; when omitted, the root layout keywords are inherited. */
  keywords?: string[];
  /** og/twitter title; defaults to the page title. */
  ogTitle?: string;
  /** og/twitter description; defaults to the page description. */
  ogDescription?: string;
  /** og/twitter image path; defaults to the site default OG image. */
  image?: string;
}

/** Build a complete `Metadata` object with consistent canonical, OG, and Twitter tags. */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const socialTitle = input.ogTitle ?? input.title;
  const socialDescription = input.ogDescription ?? input.description;
  const image = input.image ?? siteOgImage;
  return {
    title: input.brandInTitle ? { absolute: input.title } : input.title,
    description: input.description,
    ...(input.keywords ? { keywords: input.keywords } : {}),
    alternates: { canonical: input.path },
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
