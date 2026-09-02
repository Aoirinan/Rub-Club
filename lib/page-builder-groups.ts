/**
 * Website editor navigation: Office → menu group → page.
 *
 * The groups mirror the public header from left to right (Home, Services,
 * Chiropractic, Massage, About Us, Wellness Plan, Gift Cards, Patient Forms,
 * Contact Us) so staff find a page where they see it on the site. Each office
 * has its own copy of every page; Site settings lives under Home.
 *
 * Labels here are admin-facing only and never render on the public site.
 */

import { contentScopeDef, type PageBuilderScopeId } from "@/lib/page-builder-content-scopes";
import { PARIS_CHIRO_SERVICES, buildParisChiroNavChildren } from "@/lib/paris-chiro-services";
import {
  SS_INJURIES,
  SS_SERVICES,
  buildSSChiroNavChildren,
} from "@/lib/sulphur-springs-content";

export type EditorOffice = "paris" | "sulphur";

export const EDITOR_OFFICES: { id: EditorOffice; label: string }[] = [
  { id: "paris", label: "Paris" },
  { id: "sulphur", label: "Sulphur Springs" },
];

export type EditorGroupId =
  | "home"
  | "services"
  | "chiropractic"
  | "massage"
  | "about"
  | "wellness"
  | "gift-cards"
  | "patient-forms"
  | "contact";

/** Header order, left to right. */
export const EDITOR_GROUP_ORDER: { id: EditorGroupId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "chiropractic", label: "Chiropractic" },
  { id: "massage", label: "Massage" },
  { id: "about", label: "About Us" },
  { id: "wellness", label: "Wellness Plan" },
  { id: "gift-cards", label: "Gift Cards" },
  { id: "patient-forms", label: "Patient Forms" },
  { id: "contact", label: "Contact Us" },
];

export type EditorItem = {
  /** Stable key for the third dropdown (`scope` or `scope#section`). */
  key: string;
  scope: PageBuilderScopeId;
  /** When set, the form shows only this section of the scope. */
  sectionId?: string;
  label: string;
  /**
   * Pages edited on a different admin screen (legacy massage sub-pages).
   * Choosing one of these navigates there instead of changing the form.
   */
  href?: string;
};

export type EditorGroup = {
  id: EditorGroupId;
  label: string;
  office: EditorOffice;
  items: EditorItem[];
};

function item(scope: PageBuilderScopeId, label: string, sectionId?: string): EditorItem {
  return { key: sectionId ? `${scope}#${sectionId}` : scope, scope, sectionId, label };
}

function linkItem(label: string, href: string): EditorItem {
  return { key: `link:${href}`, scope: "home", label, href };
}

function sectionByLabel(scope: PageBuilderScopeId, label: string): string | null {
  const def = contentScopeDef(scope as Parameters<typeof contentScopeDef>[0]);
  return def.sections.find((s) => s.label === label)?.id ?? null;
}

const SITE_ITEMS = (header: PageBuilderScopeId, photos: PageBuilderScopeId): EditorItem[] => [
  item(header, "Header & footer"),
  item(photos, "Site photos"),
  item("site-settings", "Site settings"),
];

/** Paris Services: the /services overview, then each service page in header order. */
function parisServiceItems(): EditorItem[] {
  const out: EditorItem[] = [];
  for (const label of ["Hero", "Chiropractic card", "Massage card"]) {
    const id = sectionByLabel("paris-chiro-pages", label);
    if (id) out.push(item("paris-chiro-pages", `Services page · ${label}`, id));
  }
  const titleBySlug = new Map(PARIS_CHIRO_SERVICES.map((s) => [s.slug, s.title] as const));
  let addedLegacyLink = false;
  for (const child of buildParisChiroNavChildren()) {
    const slug = child.href.split("/").pop() ?? "";
    const prefix = child.group ? `${child.group} · ` : "";
    if (child.href.startsWith("/services/massage/")) {
      if (!addedLegacyLink) {
        out.push(linkItem(`${prefix}Massage pages… (opens Legacy pages)`, "/admin/legacy-pages"));
        addedLegacyLink = true;
      }
      continue;
    }
    const title = titleBySlug.get(slug);
    const id = title ? sectionByLabel("paris-chiro-pages", title) : null;
    if (id) out.push(item("paris-chiro-pages", `${prefix}${child.label}`, id));
  }
  return out;
}

/** Sulphur Springs Services: each service page in header order. */
function sulphurServiceItems(): EditorItem[] {
  const out: EditorItem[] = [];
  const serviceTitle = new Map(SS_SERVICES.map((s) => [s.slug, s.title] as const));
  const injuryTitle = new Map(SS_INJURIES.map((s) => [s.slug, s.title] as const));
  for (const child of buildSSChiroNavChildren()) {
    const slug = child.href.split("/").pop() ?? "";
    const prefix = child.group ? `${child.group} · ` : "";
    if (child.href === "/sulphur-springs/massage") {
      out.push(item("ss-massage", `${prefix}${child.label}`));
      continue;
    }
    const injury = injuryTitle.get(slug);
    if (injury) {
      const id = sectionByLabel("ss-conditions", injury);
      if (id) out.push(item("ss-conditions", `${prefix}${child.label}`, id));
      continue;
    }
    const title = serviceTitle.get(slug);
    const id = title ? sectionByLabel("ss-subpages", title) : null;
    if (id) out.push(item("ss-subpages", `${prefix}${child.label}`, id));
  }
  return out;
}

function giftCardItems(): EditorItem[] {
  const id = sectionByLabel("site-settings", "Header links");
  return [id ? item("site-settings", "Gift card link", id) : item("site-settings", "Gift card link")];
}

function buildGroups(): EditorGroup[] {
  const paris: Record<EditorGroupId, EditorItem[]> = {
    home: [item("home", "Home page"), ...SITE_ITEMS("paris-header", "paris-photos")],
    services: parisServiceItems(),
    chiropractic: [item("chiropractic", "Chiropractic page"), item("doctors-global", "Doctors")],
    massage: [item("massage", "Massage page"), item("massage-team", "Massage team")],
    about: [
      item("about", "About page"),
      item("paris-staff", "Staff"),
      item("doctors-global", "Doctors"),
      item("paris-office", "Office info & hours"),
      item("reviews", "Reviews"),
      item("faq-copy", "FAQ"),
    ],
    wellness: [item("wellness", "Wellness Plan")],
    "gift-cards": giftCardItems(),
    "patient-forms": [item("patient-forms", "Patient forms"), item("insurance", "Insurance")],
    contact: [item("contact", "Contact page"), item("paris-office", "Office info & hours")],
  };
  const sulphur: Record<EditorGroupId, EditorItem[]> = {
    home: [item("sulphur-springs", "Home page"), ...SITE_ITEMS("ss-header", "ss-photos")],
    services: sulphurServiceItems(),
    chiropractic: [item("sulphur-springs", "Chiropractic (home page)"), item("ss-doctors", "Doctors")],
    massage: [item("ss-massage", "Massage page"), item("ss-prices", "Massage prices")],
    about: [
      item("ss-staff", "Staff"),
      item("ss-doctors", "Doctors"),
      item("ss-office", "Office info & hours"),
      item("ss-reviews", "Reviews"),
      item("ss-faq-items", "Q & A"),
      item("ss-resources", "Patient resources"),
    ],
    wellness: [item("ss-wellness", "Wellness Plan"), item("ss-prices", "Massage prices")],
    "gift-cards": giftCardItems(),
    "patient-forms": [item("ss-patient-forms", "Patient forms"), item("ss-insurance", "Insurance")],
    contact: [item("ss-contact", "Contact page"), item("ss-office", "Office info & hours")],
  };
  const groups: EditorGroup[] = [];
  for (const office of EDITOR_OFFICES) {
    const table = office.id === "paris" ? paris : sulphur;
    for (const g of EDITOR_GROUP_ORDER) {
      groups.push({ id: g.id, label: g.label, office: office.id, items: table[g.id] });
    }
  }
  return groups;
}

let cached: EditorGroup[] | null = null;
export function editorGroups(): EditorGroup[] {
  if (!cached) cached = buildGroups();
  return cached;
}

export function isEditorOffice(value: string): value is EditorOffice {
  return EDITOR_OFFICES.some((o) => o.id === value);
}

export function groupsForOffice(office: EditorOffice): EditorGroup[] {
  return editorGroups().filter((g) => g.office === office);
}

export function officeLabel(office: EditorOffice): string {
  return EDITOR_OFFICES.find((o) => o.id === office)?.label ?? office;
}

export type EditorSelection = { group: EditorGroup; item: EditorItem };

/**
 * Locate the group/item that edits `scope` (+ optional section) for an office.
 * Falls back to the first item that edits the scope at all, so a bare
 * `?scope=` bookmark still lands somewhere sensible.
 */
export function findSelection(
  office: EditorOffice,
  scope: PageBuilderScopeId,
  sectionId?: string | null,
): EditorSelection | null {
  const groups = groupsForOffice(office);
  if (sectionId) {
    for (const group of groups) {
      const hit = group.items.find((i) => i.scope === scope && i.sectionId === sectionId && !i.href);
      if (hit) return { group, item: hit };
    }
  }
  for (const group of groups) {
    const hit = group.items.find((i) => i.scope === scope && !i.sectionId && !i.href);
    if (hit) return { group, item: hit };
  }
  for (const group of groups) {
    const hit = group.items.find((i) => i.scope === scope && !i.href);
    if (hit) return { group, item: hit };
  }
  return null;
}

/** Which office owns a scope, so a bare `?scope=` link still picks the right list. */
export function officeForScope(scope: PageBuilderScopeId): EditorOffice {
  for (const office of EDITOR_OFFICES) {
    if (office.id === "paris" && scope === "site-settings") return "paris";
    if (findSelection(office.id, scope)) return office.id;
  }
  return "paris";
}

export function firstSelectionForOffice(office: EditorOffice): EditorSelection {
  const group = groupsForOffice(office)[0]!;
  return { group, item: group.items.find((i) => !i.href) ?? group.items[0]! };
}

/** "Paris · Services · Injuries · Auto Injury" for the editing header. */
export function selectionLabel(office: EditorOffice, sel: EditorSelection): string {
  return `${officeLabel(office)} · ${sel.group.label} · ${sel.item.label}`;
}
