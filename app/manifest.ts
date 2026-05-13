import type { MetadataRoute } from "next";
import { siteDescription, siteShortName, siteTitle } from "@/lib/site-content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteTitle,
    short_name: siteShortName,
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2ea",
    theme_color: "#0f5f5c",
    icons: [
      { src: "/icon", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
