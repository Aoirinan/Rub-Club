/**
 * Website editor navigation: which office owns each editable scope.
 *
 * The editor used to list all 22 scopes in one dropdown, mixing both offices
 * together in array order. Splitting them by office keeps each list short
 * enough to scan, and labels follow the public menu wording (Home, Services,
 * Massage, Staff) so staff can find a page by the name they already know it by.
 */

import type { PageBuilderScopeId } from "@/lib/page-builder-content-scopes";

export type EditorOffice = "paris" | "sulphur" | "shared";

export type EditorEntry = {
  scope: PageBuilderScopeId;
  label: string;
  office: EditorOffice;
};

export const EDITOR_OFFICES: { id: EditorOffice; label: string }[] = [
  { id: "paris", label: "Paris" },
  { id: "sulphur", label: "Sulphur Springs" },
  { id: "shared", label: "Both / site-wide" },
];

/**
 * Labels are admin-facing only and never render on the public site.
 *
 * Paris keeps "Staff" and "Massage team" as separate entries because the two
 * rosters drive two different public pages; combining them is a pending
 * decision, not an oversight.
 */
const ENTRIES: EditorEntry[] = [
  { scope: "about", label: "About Us", office: "paris" },
  { scope: "chiropractic", label: "Chiropractic", office: "paris" },
  { scope: "doctors-global", label: "Doctors", office: "paris" },
  { scope: "home", label: "Home", office: "paris" },
  { scope: "massage", label: "Massage", office: "paris" },
  { scope: "massage-team", label: "Massage team", office: "paris" },
  { scope: "paris-office", label: "Office info", office: "paris" },
  { scope: "paris-chiro-pages", label: "Services", office: "paris" },
  { scope: "paris-staff", label: "Staff", office: "paris" },
  { scope: "wellness", label: "Wellness Plan", office: "paris" },

  { scope: "sulphur-springs", label: "Home", office: "sulphur" },
  { scope: "ss-subpages", label: "Services", office: "sulphur" },
  { scope: "ss-staff", label: "Staff", office: "sulphur" },

  { scope: "contact", label: "Contact", office: "shared" },
  { scope: "faq-items", label: "FAQ items", office: "shared" },
  { scope: "faq-copy", label: "FAQ page copy", office: "shared" },
  { scope: "footer", label: "Header & footer", office: "shared" },
  { scope: "insurance", label: "Insurance", office: "shared" },
  { scope: "navigation", label: "Navigation", office: "shared" },
  { scope: "patient-forms", label: "Patient forms", office: "shared" },
  { scope: "photos", label: "Photos", office: "shared" },
  { scope: "reviews", label: "Reviews", office: "shared" },
  { scope: "services-hub", label: "Services hub", office: "shared" },
];

export const EDITOR_ENTRIES: EditorEntry[] = [...ENTRIES].sort((a, b) => {
  if (a.office !== b.office) {
    return officeRank(a.office) - officeRank(b.office);
  }
  return a.label.localeCompare(b.label);
});

function officeRank(office: EditorOffice): number {
  return EDITOR_OFFICES.findIndex((o) => o.id === office);
}

export function isEditorOffice(value: string): value is EditorOffice {
  return EDITOR_OFFICES.some((o) => o.id === value);
}

export function entriesForOffice(office: EditorOffice): EditorEntry[] {
  return EDITOR_ENTRIES.filter((e) => e.office === office);
}

/** Which office owns a scope, so a bare `?scope=` link still picks the right list. */
export function officeForScope(scope: PageBuilderScopeId): EditorOffice {
  return EDITOR_ENTRIES.find((e) => e.scope === scope)?.office ?? "paris";
}

export function entryLabel(scope: PageBuilderScopeId): string | null {
  return EDITOR_ENTRIES.find((e) => e.scope === scope)?.label ?? null;
}

export function officeLabel(office: EditorOffice): string {
  return EDITOR_OFFICES.find((o) => o.id === office)?.label ?? office;
}

export function firstScopeForOffice(office: EditorOffice): PageBuilderScopeId {
  return entriesForOffice(office)[0]?.scope ?? "home";
}
