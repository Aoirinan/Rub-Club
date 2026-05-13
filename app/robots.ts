import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-content";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/admin/",
          "/auth/",
          "/spine-simulator/nerve_chart/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
