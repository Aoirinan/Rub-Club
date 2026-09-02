"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { MassageTeamAdminSection } from "@/app/admin/super/_components/MassageTeamAdminSection";
import { SiteStaffAdminSection } from "@/app/admin/super/_components/SiteStaffAdminSection";
import { PracticePagesEditor } from "@/components/admin/practice-pages/PracticePagesEditor";
import { useSiteContentFields } from "@/components/admin/cms/useSiteContentFields";
import {
  CONTENT_SCOPES,
  PAGE_PICKER_SCOPES,
  contentScopeDef,
  isContentScopeId,
  isFaqItemsScope,
  isMassageTeamScope,
} from "@/lib/page-builder-content-scopes";
import { isPageLayoutId, PAGE_LAYOUT_PAGES } from "@/lib/page-layout";
import {
  EDITOR_OFFICES,
  entriesForOffice,
  entryLabel,
  firstScopeForOffice,
  isEditorOffice,
  officeForScope,
  officeLabel,
  type EditorOffice,
} from "@/lib/page-builder-groups";
import type { PageBuilderScopeId } from "@/lib/page-builder-content-scopes";
import type { PracticeLocationId } from "@/lib/practice-pages-shared";
import { FaqItemsPanel } from "@/components/admin/FaqItemsPanel";
import { HeaderLogoSizeEditor } from "@/components/admin/structured-editor/HeaderLogoSizeEditor";
import { ScopeFieldForm } from "./ScopeFieldForm";
import { ALL_HEADER_LOGO_HEIGHT_FIELD_IDS } from "@/lib/header-logo-sizes";

type Props = {
  getIdToken: () => Promise<string | null>;
  initialScope?: string;
  initialOffice?: string;
};

function parseInitialScope(raw?: string): PageBuilderScopeId {
  if (raw === "header-branding" || raw === "footer" || raw === "navigation") return "paris-header";
  if (raw === "photos") return "paris-photos";
  if (raw === "services-hub") return "paris-chiro-pages";
  if (raw === "faq-items") return "faq-copy";
  if (raw && isPageLayoutId(raw)) return raw;
  if (raw && isFaqItemsScope(raw)) return raw;
  if (raw && isMassageTeamScope(raw)) return raw;
  if (raw && isContentScopeId(raw)) return raw;
  return "home";
}

function scopeLivePath(scope: PageBuilderScopeId): string | null {
  if (isPageLayoutId(scope)) {
    return PAGE_LAYOUT_PAGES.find((p) => p.id === scope)?.path ?? null;
  }
  if (scope === "home") return "/";
  if (scope === "paris-header" || scope === "site-settings") return "/";
  if (scope === "ss-header") return "/sulphur-springs";
  if (scope === "about") return "/about";
  if (scope === "contact") return "/contact";
  if (scope === "wellness") return "/wellness-care-plans";
  if (scope === "insurance") return "/insurance";
  if (scope === "reviews") return "/reviews";
  if (scope === "patient-forms") return "/patient-forms";
  if (scope === "faq-copy") return "/faq";
  if (scope === "ss-faq-items") return "/sulphur-springs/q-and-a";
  if (scope === "massage-team") return "/services/massage";
  if (scope === "paris-office") return "/locations/paris";
  if (scope === "paris-chiro-pages") return "/services/chiropractic/stretch-and-flex-rehab";
  if (scope === "paris-staff") return "/locations/paris/staff";
  if (scope === "paris-photos") return "/";
  if (scope === "ss-staff") return "/sulphur-springs/staff";
  if (scope === "ss-subpages") return "/sulphur-springs";
  if (scope === "ss-conditions") return "/sulphur-springs/common-chiropractic-conditions";
  if (scope === "ss-resources") return "/sulphur-springs/patient-resources";
  if (scope === "ss-wellness") return "/sulphur-springs/wellness-care-plans";
  if (scope === "ss-prices") return "/sulphur-springs/massage/prices";
  if (scope === "ss-doctors") return "/sulphur-springs/staff";
  if (scope === "ss-office") return "/sulphur-springs";
  if (scope === "ss-massage") return "/sulphur-springs/massage";
  if (scope === "ss-contact") return "/sulphur-springs/contact";
  if (scope === "ss-insurance") return "/sulphur-springs/insurance";
  if (scope === "ss-reviews") return "/sulphur-springs/reviews";
  if (scope === "ss-patient-forms") return "/sulphur-springs/patient-forms";
  if (scope === "ss-photos") return "/sulphur-springs/massage";
  return null;
}

function officeStaffLocationFocus(
  scope: PageBuilderScopeId,
): "paris" | "sulphur" | null {
  if (scope === "paris-staff") return "paris";
  if (scope === "ss-staff") return "sulphur";
  return null;
}

function scopeLabel(scope: PageBuilderScopeId, pages: { id: string; label: string }[]): string {
  const grouped = entryLabel(scope);
  if (grouped) return `${officeLabel(officeForScope(scope))} · ${grouped}`;
  if (isPageLayoutId(scope)) {
    return pages.find((p) => p.id === scope)?.label ?? scope;
  }
  if (scope === "faq-items" || scope === "ss-faq-items") return "FAQ";
  if (scope === "massage-team") return "Massage team";
  return CONTENT_SCOPES.find((s) => s.id === scope)?.label ?? scope;
}

/**
 * Landing pages whose layout/content is driven by the `practice_pages` docs.
 * These scopes embed the PracticePagesEditor for the mapped page and hide the
 * legacy site_content fields it replaced.
 */
const SCOPE_TO_PRACTICE_LOCATION: Record<string, PracticeLocationId> = {
  home: "paris-home",
  chiropractic: "paris-chiro",
  "sulphur-springs": "sulphur-springs",
};

function practiceLocationForScope(scope: PageBuilderScopeId): PracticeLocationId | null {
  return SCOPE_TO_PRACTICE_LOCATION[scope] ?? null;
}

/**
 * Legacy fields superseded by the practice editor for each landing scope.
 * Kept (not listed) where still consumed elsewhere: home_awards_text (awards
 * strip), chiro_treatments_list (Services nav), and the SS hours / massage /
 * contact fields used by other Sulphur Springs pages.
 */
const SUPERSEDED_FIELD_IDS: Record<string, string[]> = {
  home: [
    "home_hero_heading",
    "home_hero_subheading",
    "home_hero_cta_label",
    "home_about_blurb",
    "home_testimonials_heading",
    "home_testimonials_intro",
  ],
  chiropractic: [
    "chiro_hero_heading",
    "chiro_hero_subheading",
    "chiro_choose_title",
    "chiro_intro_body",
    "chiro_conditions_list",
    "chiro_doctors_heading",
    "chiro_doctors_intro",
    "chiro_treatments_intro",
    "chiro_testimonials_heading",
    "chiro_cta_heading",
    "chiro_cta_subtext",
    "chiro_cta_paris_label",
    "chiro_cta_ss_label",
    "chiro_cta_massage_link",
    "chiro_cta_stretch_link",
    "chiro_cta_forms_link",
    "chiro_schedule_cta_title",
    "chiro_schedule_cta_body",
    "chiro_schedule_cta_secondary",
    "chiro_testimonial_1_text",
    "chiro_testimonial_1_attr",
    "chiro_testimonial_2_text",
    "chiro_testimonial_2_attr",
    "chiro_testimonial_3_text",
    "chiro_testimonial_3_attr",
    "chiro_wellness_teaser_heading",
    "chiro_wellness_teaser_body",
  ],
  "sulphur-springs": [
    "ss_hero_heading",
    "ss_intro_body",
    "ss_doctor_heading",
    "ss_doctor_intro",
    "ss_hours",
  ],
};

export function StructuredSiteEditor({ getIdToken, initialScope, initialOffice }: Props) {
  const [scope, setScope] = useState<PageBuilderScopeId>(() => parseInitialScope(initialScope));
  const [office, setOffice] = useState<EditorOffice>(() => {
    // An explicit ?office= only wins when no scope was requested, so existing
    // ?scope= bookmarks still land on the list that actually owns the page.
    if (!initialScope && initialOffice && isEditorOffice(initialOffice)) return initialOffice;
    return officeForScope(parseInitialScope(initialScope));
  });
  const [previewKey, setPreviewKey] = useState(0);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URL(window.location.href).searchParams.get("section");
  });

  useEffect(() => {
    const a = getFirebaseClientAuth();
    setAuth(a);
    if (!a) return;
    const unsub = onAuthStateChanged(a, () => {});
    return () => unsub();
  }, []);

  const cms = useSiteContentFields({
    getIdToken,
    onSaved: () => {
      setPreviewKey((k) => k + 1);
    },
  });

  const livePath = scopeLivePath(scope);

  const pages = useMemo(
    () => PAGE_LAYOUT_PAGES.map((p) => ({ id: p.id, label: p.label })),
    [],
  );

  const officePages = useMemo(() => entriesForOffice(office), [office]);
  const pickerSections = useMemo(() => {
    if (!PAGE_PICKER_SCOPES.has(scope) || !isContentScopeId(scope)) return [];
    return contentScopeDef(scope).sections;
  }, [scope]);
  const activeSectionId =
    pickerSections.length === 0
      ? null
      : pickerSections.some((s) => s.id === sectionId)
        ? sectionId
        : (pickerSections[0]?.id ?? null);

  // The scope was previously read once at load and never written back, so a
  // selection could not be bookmarked or survive a refresh.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("scope", scope);
    url.searchParams.delete("page");
    if (activeSectionId) url.searchParams.set("section", activeSectionId);
    else url.searchParams.delete("section");
    window.history.replaceState(null, "", url);
  }, [scope, activeSectionId]);

  const chooseOffice = useCallback(
    (next: EditorOffice) => {
      setOffice(next);
      setScope((current) => {
        if (current === "site-settings") return current;
        return officeForScope(current) === next ? current : firstScopeForOffice(next);
      });
    },
    [],
  );

  const loadCms = cms.load;
  useEffect(() => {
    void loadCms();
  }, [loadCms]);

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  const staffFocus = officeStaffLocationFocus(scope);

  const practiceLocation = practiceLocationForScope(scope);
  const widePane =
    Boolean(practiceLocation) ||
    Boolean(staffFocus) ||
    scope === "massage-team" ||
    scope === "ss-massage" ||
    scope === "paris-header" ||
    scope === "ss-header" ||
    scope === "faq-copy" ||
    scope === "ss-faq-items";

  const headerForm =
    scope === "paris-header" || scope === "ss-header" ? (
      <div className="space-y-6">
        <HeaderLogoSizeEditor
          fields={cms.fields}
          brands={scope === "ss-header" ? ["ss"] : ["chiro"]}
          busy={cms.busy}
          onSave={async (id, value) => {
            await cms.saveField(id, value);
            setPreviewKey((k) => k + 1);
          }}
        />
        <ScopeFieldForm
          scope={scope}
          fields={cms.fields}
          busy={cms.busy}
          message={cms.message}
          onSave={cms.saveField}
          onReset={cms.resetField}
          excludeFieldIds={ALL_HEADER_LOGO_HEIGHT_FIELD_IDS}
        />
      </div>
    ) : null;

  let main: React.ReactNode = null;
  if (scope === "faq-copy") {
    main = (
      <div className="space-y-6">
        <ScopeFieldForm
          scope={scope}
          fields={cms.fields}
          busy={cms.busy}
          message={cms.message}
          onSave={cms.saveField}
          onReset={cms.resetField}
        />
        <FaqItemsPanel getIdToken={getIdToken} category="general" />
      </div>
    );
  } else if (scope === "ss-faq-items" || scope === "faq-items") {
    main = (
      <FaqItemsPanel
        getIdToken={getIdToken}
        category={scope === "ss-faq-items" ? "sulphur-springs" : undefined}
      />
    );
  } else if (scope === "massage-team") {
    main = (
      <MassageTeamAdminSection
        auth={auth}
        onNotify={() => setPreviewKey((k) => k + 1)}
      />
    );
  } else if (scope === "ss-massage") {
    main = (
      <div className="space-y-6">
        <ScopeFieldForm
          scope={scope}
          fields={cms.fields}
          busy={cms.busy}
          message={cms.message}
          onSave={cms.saveField}
          onReset={cms.resetField}
        />
        <SiteStaffAdminSection
          auth={auth}
          locationFocus="sulphur"
          roleFilter="massage"
          heading="Massage therapists — Sulphur Springs"
          onNotify={() => setPreviewKey((k) => k + 1)}
        />
      </div>
    );
  } else if (practiceLocation) {
    main = (
      <div className="space-y-6">
        <PracticePagesEditor
          getIdToken={getIdToken}
          initialLocation={practiceLocation}
          embedded
        />
        <ScopeFieldForm
          scope={scope}
          fields={cms.fields}
          busy={cms.busy}
          message={cms.message}
          onSave={cms.saveField}
          onReset={cms.resetField}
          excludeFieldIds={SUPERSEDED_FIELD_IDS[scope]}
        />
      </div>
    );
  } else if (staffFocus) {
    main = (
      <div className="space-y-6">
        <ScopeFieldForm
          scope={scope}
          fields={cms.fields}
          busy={cms.busy}
          message={cms.message}
          onSave={cms.saveField}
          onReset={cms.resetField}
        />
        <SiteStaffAdminSection
          auth={auth}
          locationFocus={staffFocus}
          onNotify={() => setPreviewKey((k) => k + 1)}
        />
      </div>
    );
  } else if (headerForm) {
    main = headerForm;
  } else {
    main = (
      <ScopeFieldForm
        scope={scope}
        fields={cms.fields}
        busy={cms.busy}
        message={cms.message}
        onSave={cms.saveField}
        onReset={cms.resetField}
        onlySectionId={activeSectionId}
      />
    );
  }

  return (
    <div className="relative isolate z-0 flex min-h-[calc(100vh-4rem)] flex-col bg-slate-100">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Website editor</h1>
        <span className="hidden text-xs text-slate-500 sm:inline">
          Pick what to edit, change a field, save — changes appear on the live site within ~60 seconds.
        </span>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <label className="text-sm">
            <span className="sr-only">Office</span>
            <select
              className="max-w-[180px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              value={office}
              onChange={(e) => {
                const next = e.target.value;
                if (isEditorOffice(next)) chooseOffice(next);
              }}
            >
              {EDITOR_OFFICES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="sr-only">Page or section</span>
            <select
              className="max-w-[240px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              value={scope}
              onChange={(e) => setScope(parseInitialScope(e.target.value))}
            >
              {officePages.map((entry) => (
                <option key={entry.scope} value={entry.scope}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          {pickerSections.length > 0 ? (
            <label className="text-sm">
              <span className="sr-only">Which page</span>
              <select
                className="max-w-[280px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                value={activeSectionId ?? ""}
                onChange={(e) => setSectionId(e.target.value)}
              >
                {pickerSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {livePath ? (
            <a
              href={livePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#c0392b] underline"
            >
              View live ↗
            </a>
          ) : null}
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={refreshPreview}
          >
            Refresh preview
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-0 lg:flex-row">
        <main
          className={`min-w-0 flex-1 p-4 lg:p-6 ${
            widePane ? "lg:max-w-3xl" : "lg:max-w-2xl"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Editing: {scopeLabel(scope, pages)}
            </h2>
            {cms.message ? (
              <p
                className={`text-xs font-bold ${
                  cms.message.kind === "ok" ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {cms.message.text}
              </p>
            ) : null}
          </div>
          {cms.loading ? (
            <p className="text-sm text-slate-600">Loading…</p>
          ) : (
            main
          )}
        </main>

        {livePath ? (
          <aside className="hidden w-full shrink-0 border-t border-slate-200 bg-white lg:flex lg:w-[640px] lg:flex-col lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Live preview — {livePath}
              </p>
              <a
                href={livePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#c0392b] underline"
              >
                Open ↗
              </a>
            </div>
            <iframe
              key={`${livePath}-${previewKey}`}
              src={livePath}
              title="Site preview"
              className="h-full min-h-[calc(100vh-9rem)] w-full"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
