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
  { path: "/sulphur-springs", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sulphur-springs/staff", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sulphur-springs/acupuncture", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/adjustments-and-manipulation", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/common-chiropractic-conditions", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/degenerative-disc-disease", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/electrical-muscle-stimulation", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/ice-pack-cryotherapy", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/postural-rehabilitation", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/spinal-decompression", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/therapeutic-exercise", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/therapeutic-ultrasound", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/auto-injury", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/personal-injury", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/sports-injury", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sulphur-springs/patient-resources", changeFrequency: "monthly", priority: 0.55 },
  { path: "/sulphur-springs/q-and-a", changeFrequency: "monthly", priority: 0.55 },
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
