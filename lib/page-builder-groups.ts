/**
 * Website editor navigation: which office owns each editable scope.
 *
 * There is no shared/site-wide group. Each office has its own copy of every
 * page, plus a pinned Site settings entry for the handful of fields that
 * really are global (tagline, copyright, accessibility button, etc.).
 */

import type { PageBuilderScopeId } from "@/lib/page-builder-content-scopes";

export type EditorOffice = "paris" | "sulphur";

export type EditorEntry = {
  scope: PageBuilderScopeId;
  label: string;
  office: EditorOffice;
};

export const EDITOR_OFFICES: { id: EditorOffice; label: string }[] = [
  { id: "paris", label: "Paris" },
  { id: "sulphur", label: "Sulphur Springs" },
];

/**
 * Labels are admin-facing only and never render on the public site.
 *
 * Paris keeps "Staff" and "Massage team" as separate entries because the two
 * rosters drive two different public pages.
 */
const ENTRIES: EditorEntry[] = [
  { scope: "about", label: "About Us", office: "paris" },
  { scope: "chiropractic", label: "Chiropractic", office: "paris" },
  { scope: "contact", label: "Contact", office: "paris" },
  { scope: "doctors-global", label: "Doctors", office: "paris" },
  { scope: "faq-copy", label: "FAQ", office: "paris" },
  { scope: "paris-header", label: "Header & footer", office: "paris" },
  { scope: "home", label: "Home", office: "paris" },
  { scope: "insurance", label: "Insurance", office: "paris" },
  { scope: "massage", label: "Massage", office: "paris" },
  { scope: "massage-team", label: "Massage team", office: "paris" },
  { scope: "paris-office", label: "Office info", office: "paris" },
  { scope: "patient-forms", label: "Patient forms", office: "paris" },
  { scope: "paris-photos", label: "Photos", office: "paris" },
  { scope: "reviews", label: "Reviews", office: "paris" },
  { scope: "paris-chiro-pages", label: "Services", office: "paris" },
  { scope: "site-settings", label: "Site settings", office: "paris" },
  { scope: "paris-staff", label: "Staff", office: "paris" },
  { scope: "wellness", label: "Wellness Plan", office: "paris" },

  { scope: "ss-contact", label: "Contact", office: "sulphur" },
  { scope: "ss-conditions", label: "Conditions", office: "sulphur" },
  { scope: "ss-doctors", label: "Doctors", office: "sulphur" },
  { scope: "ss-faq-items", label: "FAQ", office: "sulphur" },
  { scope: "ss-header", label: "Header & footer", office: "sulphur" },
  { scope: "sulphur-springs", label: "Home", office: "sulphur" },
  { scope: "ss-insurance", label: "Insurance", office: "sulphur" },
  { scope: "ss-massage", label: "Massage", office: "sulphur" },
  { scope: "ss-office", label: "Office info", office: "sulphur" },
  { scope: "ss-patient-forms", label: "Patient forms", office: "sulphur" },
  { scope: "ss-resources", label: "Patient resources", office: "sulphur" },
  { scope: "ss-photos", label: "Photos", office: "sulphur" },
  { scope: "ss-prices", label: "Prices", office: "sulphur" },
  { scope: "ss-reviews", label: "Reviews", office: "sulphur" },
  { scope: "ss-subpages", label: "Services", office: "sulphur" },
  { scope: "site-settings", label: "Site settings", office: "sulphur" },
  { scope: "ss-staff", label: "Staff", office: "sulphur" },
  { scope: "ss-wellness", label: "Wellness Plan", office: "sulphur" },
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

export function entryLabel(scope: PageBuilderScopeId, office?: EditorOffice): string | null {
  if (office) {
    return EDITOR_ENTRIES.find((e) => e.scope === scope && e.office === office)?.label ?? null;
  }
  return EDITOR_ENTRIES.find((e) => e.scope === scope)?.label ?? null;
}

export function officeLabel(office: EditorOffice): string {
  return EDITOR_OFFICES.find((o) => o.id === office)?.label ?? office;
}

export function firstScopeForOffice(office: EditorOffice): PageBuilderScopeId {
  return entriesForOffice(office)[0]?.scope ?? "home";
}
