import type { CSSProperties } from "react";
import { getPageBrand, isSulphurSpringsBrand } from "@/lib/page-business-theme";

export const dynamic = "force-dynamic";

/**
 * The sign-in page follows the site the visitor came from (cookie), like the
 * other shared pages: Sulphur Springs blue or Paris red.
 */
export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getPageBrand();
  const vars = (
    isSulphurSpringsBrand(brand)
      ? {
          "--login-accent": "#2980b9",
          "--login-accent-hover": "#1a6da3",
          "--login-heading": "#0c2d3a",
          "--login-tint": "#eaf4fb",
        }
      : {
          "--login-accent": "#c0392b",
          "--login-accent-hover": "#962d22",
          "--login-heading": "#4a1515",
          "--login-tint": "#fdf6f5",
        }
  ) as CSSProperties;
  return <div style={vars}>{children}</div>;
}
