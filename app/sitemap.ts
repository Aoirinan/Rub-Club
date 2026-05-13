import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-content";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const ENTRIES: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/book", changeFrequency: "weekly", priority: 0.95 },
  { path: "/chiropractic", changeFrequency: "monthly", priority: 0.9 },
  { path: "/massage", changeFrequency: "monthly", priority: 0.9 },
  { path: "/services/chiropractic", changeFrequency: "monthly", priority: 0.85 },
  { path: "/services/massage", changeFrequency: "monthly", priority: 0.85 },
  { path: "/meet-the-doctors", changeFrequency: "monthly", priority: 0.85 },
  { path: "/locations", changeFrequency: "monthly", priority: 0.85 },
  { path: "/locations/paris", changeFrequency: "monthly", priority: 0.82 },
  { path: "/locations/sulphur-springs", changeFrequency: "monthly", priority: 0.82 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.65 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.65 },
  { path: "/insurance", changeFrequency: "monthly", priority: 0.55 },
  { path: "/reviews", changeFrequency: "monthly", priority: 0.55 },
  { path: "/patient-forms", changeFrequency: "yearly", priority: 0.5 },
  { path: "/spine-simulator", changeFrequency: "yearly", priority: 0.45 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const lastModified = new Date();
  return ENTRIES.map((e) => ({
    url: `${origin}${e.path}`,
    lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
