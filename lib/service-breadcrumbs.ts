/** Shared breadcrumb trail for service marketing pages. */

export const SERVICES_HUB_PATH = "/services" as const;

export type BreadcrumbItem = { name: string; url: string };

export function serviceBreadcrumbs(current: BreadcrumbItem): readonly BreadcrumbItem[] {
  return [
    { name: "Home", url: "/" },
    { name: "Services", url: SERVICES_HUB_PATH },
    current,
  ];
}

export function chiropracticWellnessBreadcrumbs(
  currentUrl: string,
): readonly BreadcrumbItem[] {
  return [
    { name: "Home", url: "/" },
    { name: "Services", url: SERVICES_HUB_PATH },
    { name: "Chiropractic", url: "/services/chiropractic" },
    { name: "Wellness care plans", url: currentUrl },
  ];
}
