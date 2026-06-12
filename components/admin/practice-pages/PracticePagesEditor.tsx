"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  PRACTICE_LOCATION_IDS,
  PRACTICE_LOCATION_LABELS,
  PRACTICE_PAGE_PATHS,
  type PracticeAboutBlock,
  type PracticeExtra,
  type PracticeLocationId,
  type PracticePageDoc,
  type PracticeQuickAction,
  type PracticeServiceCard,
  type PracticeTeamSection,
} from "@/lib/practice-pages-shared";
import { PRACTICE_THEMES } from "@/components/practice/theme";
import { PracticeTestimonialsPanel } from "./PracticeTestimonialsPanel";

type Props = {
  getIdToken: () => Promise<string | null>;
};

const INPUT = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const TEXTAREA = `${INPUT} min-h-[90px]`;
const SMALL_BTN = "text-xs font-semibold underline";
const ICON_OPTIONS = ["team", "forms", "hours", "calendar", "arrow"] as const;

function SectionCard({
  title,
  hint,
  published,
  onPublishedChange,
  children,
}: {
  title: string;
  hint?: string;
  published?: boolean;
  onPublishedChange?: (v: boolean) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden className="text-slate-400">
            {open ? "▾" : "▸"}
          </span>
          <span className="text-base font-semibold text-slate-900">{title}</span>
        </button>
        {published !== undefined && onPublishedChange ? (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => onPublishedChange(e.target.checked)}
            />
            Published
          </label>
        ) : null}
      </div>
      {open ? (
        <div className="space-y-4 border-t border-slate-100 px-5 py-4">
          {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  /** Default hex shown when the field is empty. */
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const shown = value.trim() || placeholder;
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-8 w-8 shrink-0 rounded-lg border border-slate-300"
          style={{ backgroundColor: shown }}
        />
        <input
          className={INPUT}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  );
}

function moveItem<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[j]] = [next[j]!, next[index]!];
  return next;
}

function ImageField({
  label,
  value,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  return (
    <div className="space-y-2 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="h-20 w-32 rounded-lg border border-slate-200 object-cover"
        />
      ) : null}
      <input
        className={INPUT}
        placeholder="https://… or /images/…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="w-full text-xs"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = await onUpload(file);
          if (url) onChange(url);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function PracticePagesEditor({ getIdToken }: Props) {
  const [location, setLocation] = useState<PracticeLocationId>("paris-chiro");
  const [doc, setDoc] = useState<PracticePageDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDoc(null);
    setDirty(false);
    setMessage(null);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch(`/api/admin/practice-pages/${location}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { page?: PracticePageDoc; error?: string };
      if (res.ok && data.page) setDoc(data.page);
      else setMessage(data.error ?? "Could not load page content.");
    } finally {
      setLoading(false);
    }
  }, [getIdToken, location]);

  useEffect(() => {
    void load();
  }, [load]);

  function update(updater: (prev: PracticePageDoc) => PracticePageDoc) {
    setDoc((prev) => (prev ? updater(prev) : prev));
    setDirty(true);
  }

  async function save() {
    if (!doc) return;
    setSaving(true);
    setMessage(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not signed in");
      const res = await fetch(`/api/admin/practice-pages/${location}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(doc),
      });
      const data = (await res.json()) as { page?: PracticePageDoc; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (data.page) setDoc(data.page);
      setDirty(false);
      setMessage("Saved. The public page updates within a minute.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(slot: string, file: File): Promise<string | null> {
    const token = await getIdToken();
    if (!token) return null;
    const form = new FormData();
    form.set("file", file);
    form.set("slot", slot);
    const res = await fetch(`/api/admin/practice-pages/${location}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setMessage(data.error ?? "Upload failed");
      return null;
    }
    return data.url;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Practice pages</h1>
          <p className="mt-1 text-sm text-slate-600">
            One layout, three pages. Pick a page, edit its sections in page order, and save.
          </p>
        </div>
        <Link
          href={PRACTICE_PAGE_PATHS[location]}
          target="_blank"
          className="text-sm font-semibold text-[#c0392b] underline"
        >
          View page ↗
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRACTICE_LOCATION_IDS.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => {
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              setLocation(loc);
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              location === loc
                ? "bg-[#c0392b] text-white shadow-sm"
                : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {PRACTICE_LOCATION_LABELS[loc]}
          </button>
        ))}
      </div>

      {message ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">{message}</p>
      ) : null}

      {loading || !doc ? (
        <p className="py-12 text-center text-sm text-slate-600">Loading…</p>
      ) : (
        <>
          <div className="space-y-4">
            {/* 0. Theme colors */}
            <SectionCard
              title="0 · Theme colors"
              hint="Colors for this page's headings, circles, buttons, and hero panel. Leave a field empty to use the location default (red for Paris, blue for Sulphur Springs). Hero panel colors accept 8-digit hex for transparency (e.g. #8e2f23e6). Header/nav bar colors are edited in Website settings."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField
                  label="Accent (headings, circles, quotes)"
                  value={doc.theme.accent}
                  placeholder={PRACTICE_THEMES[location].accent}
                  onChange={(v) => update((p) => ({ ...p, theme: { ...p.theme, accent: v } }))}
                />
                <ColorField
                  label="Accent hover"
                  value={doc.theme.accentHover}
                  placeholder={PRACTICE_THEMES[location].accentHover}
                  onChange={(v) =>
                    update((p) => ({ ...p, theme: { ...p.theme, accentHover: v } }))
                  }
                />
                <ColorField
                  label="Heading text"
                  value={doc.theme.heading}
                  placeholder={PRACTICE_THEMES[location].heading}
                  onChange={(v) => update((p) => ({ ...p, theme: { ...p.theme, heading: v } }))}
                />
                <ColorField
                  label="Button color"
                  value={doc.theme.ctaBg}
                  placeholder={PRACTICE_THEMES[location].ctaBg}
                  onChange={(v) => update((p) => ({ ...p, theme: { ...p.theme, ctaBg: v } }))}
                />
                <ColorField
                  label="Button hover"
                  value={doc.theme.ctaHover}
                  placeholder={PRACTICE_THEMES[location].ctaHover}
                  onChange={(v) => update((p) => ({ ...p, theme: { ...p.theme, ctaHover: v } }))}
                />
                <ColorField
                  label="Hero panel gradient start"
                  value={doc.theme.heroPanelFrom}
                  placeholder={PRACTICE_THEMES[location].heroPanelFrom}
                  onChange={(v) =>
                    update((p) => ({ ...p, theme: { ...p.theme, heroPanelFrom: v } }))
                  }
                />
                <ColorField
                  label="Hero panel gradient middle"
                  value={doc.theme.heroPanelVia}
                  placeholder={PRACTICE_THEMES[location].heroPanelVia}
                  onChange={(v) =>
                    update((p) => ({ ...p, theme: { ...p.theme, heroPanelVia: v } }))
                  }
                />
              </div>
            </SectionCard>

            {/* 1. Utility bar */}
            <SectionCard
              title="1 · Utility bar"
              hint="Thin contact strip at the very top: phones, address (links to Google Maps), social icons."
              published={doc.utilityBar.published}
              onPublishedChange={(v) =>
                update((p) => ({ ...p, utilityBar: { ...p.utilityBar, published: v } }))
              }
            >
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-800">Phone lines</span>
                {doc.utilityBar.phones.map((phone, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      className={`${INPUT} flex-1`}
                      placeholder="Label (e.g. Chiropractic)"
                      value={phone.label}
                      onChange={(e) =>
                        update((p) => {
                          const phones = [...p.utilityBar.phones];
                          phones[i] = { ...phones[i]!, label: e.target.value };
                          return { ...p, utilityBar: { ...p.utilityBar, phones } };
                        })
                      }
                    />
                    <input
                      className={`${INPUT} w-40`}
                      placeholder="903-…"
                      value={phone.number}
                      onChange={(e) =>
                        update((p) => {
                          const phones = [...p.utilityBar.phones];
                          phones[i] = { ...phones[i]!, number: e.target.value };
                          return { ...p, utilityBar: { ...p.utilityBar, phones } };
                        })
                      }
                    />
                    <button
                      type="button"
                      className={`${SMALL_BTN} text-rose-700`}
                      onClick={() =>
                        update((p) => ({
                          ...p,
                          utilityBar: {
                            ...p.utilityBar,
                            phones: p.utilityBar.phones.filter((_, j) => j !== i),
                          },
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={SMALL_BTN}
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      utilityBar: {
                        ...p.utilityBar,
                        phones: [...p.utilityBar.phones, { label: "", number: "" }],
                      },
                    }))
                  }
                >
                  + Add phone line
                </button>
              </div>
              <Field label="Address">
                <input
                  className={INPUT}
                  value={doc.utilityBar.address}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      utilityBar: { ...p.utilityBar, address: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Google Maps link">
                <input
                  className={INPUT}
                  value={doc.utilityBar.mapsUrl}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      utilityBar: { ...p.utilityBar, mapsUrl: e.target.value },
                    }))
                  }
                />
              </Field>
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-800">Social links</span>
                {doc.utilityBar.socialLinks.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      className={`${INPUT} w-36`}
                      placeholder="facebook / instagram"
                      value={s.platform}
                      onChange={(e) =>
                        update((p) => {
                          const socialLinks = [...p.utilityBar.socialLinks];
                          socialLinks[i] = { ...socialLinks[i]!, platform: e.target.value };
                          return { ...p, utilityBar: { ...p.utilityBar, socialLinks } };
                        })
                      }
                    />
                    <input
                      className={`${INPUT} flex-1`}
                      placeholder="https://…"
                      value={s.url}
                      onChange={(e) =>
                        update((p) => {
                          const socialLinks = [...p.utilityBar.socialLinks];
                          socialLinks[i] = { ...socialLinks[i]!, url: e.target.value };
                          return { ...p, utilityBar: { ...p.utilityBar, socialLinks } };
                        })
                      }
                    />
                    <button
                      type="button"
                      className={`${SMALL_BTN} text-rose-700`}
                      onClick={() =>
                        update((p) => ({
                          ...p,
                          utilityBar: {
                            ...p.utilityBar,
                            socialLinks: p.utilityBar.socialLinks.filter((_, j) => j !== i),
                          },
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={SMALL_BTN}
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      utilityBar: {
                        ...p.utilityBar,
                        socialLinks: [...p.utilityBar.socialLinks, { platform: "", url: "" }],
                      },
                    }))
                  }
                >
                  + Add social link
                </button>
              </div>
            </SectionCard>

            {/* 2. Hero */}
            <SectionCard
              title="2 · Hero"
              hint="Full-width photo with the practice heading, tagline, and Request Appointment / Call buttons."
              published={doc.hero.published}
              onPublishedChange={(v) =>
                update((p) => ({ ...p, hero: { ...p.hero, published: v } }))
              }
            >
              <Field label="Eyebrow (small text above the heading)">
                <input
                  className={INPUT}
                  value={doc.hero.eyebrow}
                  onChange={(e) =>
                    update((p) => ({ ...p, hero: { ...p.hero, eyebrow: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Heading">
                <input
                  className={INPUT}
                  value={doc.hero.heading}
                  onChange={(e) =>
                    update((p) => ({ ...p, hero: { ...p.hero, heading: e.target.value } }))
                  }
                />
              </Field>
              <Field label="Tagline">
                <input
                  className={INPUT}
                  value={doc.hero.tagline}
                  onChange={(e) =>
                    update((p) => ({ ...p, hero: { ...p.hero, tagline: e.target.value } }))
                  }
                />
              </Field>
              <ImageField
                label="Hero photo"
                value={doc.hero.imageUrl}
                onChange={(url) =>
                  update((p) => ({ ...p, hero: { ...p.hero, imageUrl: url } }))
                }
                onUpload={(file) => uploadImage("hero", file)}
              />
              <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">
                  Extra slides (optional). The hero rotates through the main photo plus these.
                </p>
                {doc.hero.slides.map((slide, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1">
                      <ImageField
                        label={`Slide ${i + 2}`}
                        value={slide}
                        onChange={(url) =>
                          update((p) => {
                            const slides = [...p.hero.slides];
                            slides[i] = url;
                            return { ...p, hero: { ...p.hero, slides } };
                          })
                        }
                        onUpload={(file) => uploadImage(`hero_slide_${i}`, file)}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${SMALL_BTN} mt-6 text-rose-700`}
                      onClick={() =>
                        update((p) => ({
                          ...p,
                          hero: { ...p.hero, slides: p.hero.slides.filter((_, j) => j !== i) },
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={SMALL_BTN}
                  onClick={() =>
                    update((p) => ({ ...p, hero: { ...p.hero, slides: [...p.hero.slides, ""] } }))
                  }
                >
                  + Add slide
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="CTA label">
                  <input
                    className={INPUT}
                    value={doc.hero.ctaLabel}
                    onChange={(e) =>
                      update((p) => ({ ...p, hero: { ...p.hero, ctaLabel: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="CTA link (blank = call popup)">
                  <input
                    className={INPUT}
                    value={doc.hero.ctaUrl}
                    onChange={(e) =>
                      update((p) => ({ ...p, hero: { ...p.hero, ctaUrl: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="Call phone">
                  <input
                    className={INPUT}
                    value={doc.hero.callPhone}
                    onChange={(e) =>
                      update((p) => ({ ...p, hero: { ...p.hero, callPhone: e.target.value } }))
                    }
                  />
                </Field>
              </div>
            </SectionCard>

            {/* 3. Quick actions */}
            <SectionCard
              title="3 · Quick actions"
              hint="Tappable shortcut cards under the hero. Reorder with the arrows."
              published={doc.quickActions.published}
              onPublishedChange={(v) =>
                update((p) => ({ ...p, quickActions: { ...p.quickActions, published: v } }))
              }
            >
              {doc.quickActions.items.map((item: PracticeQuickAction, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    className={`${INPUT} flex-1`}
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) =>
                      update((p) => {
                        const items = [...p.quickActions.items];
                        items[i] = { ...items[i]!, label: e.target.value };
                        return { ...p, quickActions: { ...p.quickActions, items } };
                      })
                    }
                  />
                  <select
                    className={`${INPUT} w-32`}
                    value={item.icon}
                    onChange={(e) =>
                      update((p) => {
                        const items = [...p.quickActions.items];
                        items[i] = { ...items[i]!, icon: e.target.value };
                        return { ...p, quickActions: { ...p.quickActions, items } };
                      })
                    }
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <input
                    className={`${INPUT} w-56`}
                    placeholder="/path or #anchor"
                    value={item.url}
                    onChange={(e) =>
                      update((p) => {
                        const items = [...p.quickActions.items];
                        items[i] = { ...items[i]!, url: e.target.value };
                        return { ...p, quickActions: { ...p.quickActions, items } };
                      })
                    }
                  />
                  <button
                    type="button"
                    className={SMALL_BTN}
                    onClick={() =>
                      update((p) => ({
                        ...p,
                        quickActions: {
                          ...p.quickActions,
                          items: moveItem(p.quickActions.items, i, -1),
                        },
                      }))
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={SMALL_BTN}
                    onClick={() =>
                      update((p) => ({
                        ...p,
                        quickActions: {
                          ...p.quickActions,
                          items: moveItem(p.quickActions.items, i, 1),
                        },
                      }))
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={`${SMALL_BTN} text-rose-700`}
                    onClick={() =>
                      update((p) => ({
                        ...p,
                        quickActions: {
                          ...p.quickActions,
                          items: p.quickActions.items.filter((_, j) => j !== i),
                        },
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={SMALL_BTN}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    quickActions: {
                      ...p.quickActions,
                      items: [...p.quickActions.items, { label: "", icon: "arrow", url: "" }],
                    },
                  }))
                }
              >
                + Add card
              </button>
            </SectionCard>

            {/* 4. Services grid */}
            <SectionCard
              title="4 · Services grid"
              hint={
                doc.servicesGrid.mode === "ss-services"
                  ? "Cards come from the Sulphur Springs services list. Edit each card's blurb/image under Website → Sulphur subpages."
                  : "Service cards with image (or icon), name, blurb, and Read More link."
              }
              published={doc.servicesGrid.published}
              onPublishedChange={(v) =>
                update((p) => ({ ...p, servicesGrid: { ...p.servicesGrid, published: v } }))
              }
            >
              <Field label="Heading">
                <input
                  className={INPUT}
                  value={doc.servicesGrid.heading}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      servicesGrid: { ...p.servicesGrid, heading: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Intro">
                <textarea
                  className={TEXTAREA}
                  value={doc.servicesGrid.intro}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      servicesGrid: { ...p.servicesGrid, intro: e.target.value },
                    }))
                  }
                />
              </Field>
              {doc.servicesGrid.mode === "custom" ? (
                <div className="space-y-4">
                  {doc.servicesGrid.cards.map((card: PracticeServiceCard, i) => (
                    <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className={`${INPUT} flex-1`}
                          placeholder="Service name"
                          value={card.name}
                          onChange={(e) =>
                            update((p) => {
                              const cards = [...p.servicesGrid.cards];
                              cards[i] = { ...cards[i]!, name: e.target.value };
                              return { ...p, servicesGrid: { ...p.servicesGrid, cards } };
                            })
                          }
                        />
                        <input
                          className={`${INPUT} w-64`}
                          placeholder="Read More link (optional)"
                          value={card.href}
                          onChange={(e) =>
                            update((p) => {
                              const cards = [...p.servicesGrid.cards];
                              cards[i] = { ...cards[i]!, href: e.target.value };
                              return { ...p, servicesGrid: { ...p.servicesGrid, cards } };
                            })
                          }
                        />
                        <button
                          type="button"
                          className={SMALL_BTN}
                          onClick={() =>
                            update((p) => ({
                              ...p,
                              servicesGrid: {
                                ...p.servicesGrid,
                                cards: moveItem(p.servicesGrid.cards, i, -1),
                              },
                            }))
                          }
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={SMALL_BTN}
                          onClick={() =>
                            update((p) => ({
                              ...p,
                              servicesGrid: {
                                ...p.servicesGrid,
                                cards: moveItem(p.servicesGrid.cards, i, 1),
                              },
                            }))
                          }
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className={`${SMALL_BTN} text-rose-700`}
                          onClick={() =>
                            update((p) => ({
                              ...p,
                              servicesGrid: {
                                ...p.servicesGrid,
                                cards: p.servicesGrid.cards.filter((_, j) => j !== i),
                              },
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        className={`${INPUT} min-h-[60px]`}
                        placeholder="Short blurb"
                        value={card.blurb}
                        onChange={(e) =>
                          update((p) => {
                            const cards = [...p.servicesGrid.cards];
                            cards[i] = { ...cards[i]!, blurb: e.target.value };
                            return { ...p, servicesGrid: { ...p.servicesGrid, cards } };
                          })
                        }
                      />
                      <ImageField
                        label="Card image (optional — icon shown when blank)"
                        value={card.imageUrl}
                        onChange={(url) =>
                          update((p) => {
                            const cards = [...p.servicesGrid.cards];
                            cards[i] = { ...cards[i]!, imageUrl: url };
                            return { ...p, servicesGrid: { ...p.servicesGrid, cards } };
                          })
                        }
                        onUpload={(file) => uploadImage(`service_card_${i}`, file)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className={SMALL_BTN}
                    onClick={() =>
                      update((p) => ({
                        ...p,
                        servicesGrid: {
                          ...p.servicesGrid,
                          cards: [
                            ...p.servicesGrid.cards,
                            { name: "", blurb: "", imageUrl: "", href: "" },
                          ],
                        },
                      }))
                    }
                  >
                    + Add service card
                  </button>
                </div>
              ) : null}
            </SectionCard>

            {/* 5. About / welcome blocks */}
            <SectionCard
              title="5 · About / welcome blocks"
              hint="Stacked two-column sections: rich text beside a photo, with phone and/or link CTAs. The home page stacks two."
            >
              {doc.aboutBlocks.map((block: PracticeAboutBlock, i) => (
                <div key={block.id || i} className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Block {i + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={block.published}
                          onChange={(e) =>
                            update((p) => {
                              const aboutBlocks = [...p.aboutBlocks];
                              aboutBlocks[i] = { ...aboutBlocks[i]!, published: e.target.checked };
                              return { ...p, aboutBlocks };
                            })
                          }
                        />
                        Published
                      </label>
                      <button
                        type="button"
                        className={SMALL_BTN}
                        onClick={() =>
                          update((p) => ({ ...p, aboutBlocks: moveItem(p.aboutBlocks, i, -1) }))
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={SMALL_BTN}
                        onClick={() =>
                          update((p) => ({ ...p, aboutBlocks: moveItem(p.aboutBlocks, i, 1) }))
                        }
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={`${SMALL_BTN} text-rose-700`}
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            aboutBlocks: p.aboutBlocks.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        Remove block
                      </button>
                    </div>
                  </div>
                  <Field label="Heading">
                    <input
                      className={INPUT}
                      value={block.heading}
                      onChange={(e) =>
                        update((p) => {
                          const aboutBlocks = [...p.aboutBlocks];
                          aboutBlocks[i] = { ...aboutBlocks[i]!, heading: e.target.value };
                          return { ...p, aboutBlocks };
                        })
                      }
                    />
                  </Field>
                  <Field label="Body (blank line between paragraphs)">
                    <textarea
                      className={`${INPUT} min-h-[160px]`}
                      value={block.body}
                      onChange={(e) =>
                        update((p) => {
                          const aboutBlocks = [...p.aboutBlocks];
                          aboutBlocks[i] = { ...aboutBlocks[i]!, body: e.target.value };
                          return { ...p, aboutBlocks };
                        })
                      }
                    />
                  </Field>
                  <Field label="Bullet list (one per line, optional)">
                    <textarea
                      className={TEXTAREA}
                      value={block.bullets.join("\n")}
                      onChange={(e) =>
                        update((p) => {
                          const aboutBlocks = [...p.aboutBlocks];
                          aboutBlocks[i] = {
                            ...aboutBlocks[i]!,
                            bullets: e.target.value
                              .split(/\r?\n/)
                              .filter((l) => l.trim().length > 0),
                          };
                          return { ...p, aboutBlocks };
                        })
                      }
                    />
                  </Field>
                  <ImageField
                    label="Photo (optional)"
                    value={block.imageUrl}
                    onChange={(url) =>
                      update((p) => {
                        const aboutBlocks = [...p.aboutBlocks];
                        aboutBlocks[i] = { ...aboutBlocks[i]!, imageUrl: url };
                        return { ...p, aboutBlocks };
                      })
                    }
                    onUpload={(file) => uploadImage(`about_${i}`, file)}
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Phone CTA label (blank hides it)">
                      <input
                        className={INPUT}
                        value={block.phoneCtaLabel}
                        onChange={(e) =>
                          update((p) => {
                            const aboutBlocks = [...p.aboutBlocks];
                            aboutBlocks[i] = { ...aboutBlocks[i]!, phoneCtaLabel: e.target.value };
                            return { ...p, aboutBlocks };
                          })
                        }
                      />
                    </Field>
                    <Field label="Link CTA label (optional)">
                      <input
                        className={INPUT}
                        value={block.ctaLabel}
                        onChange={(e) =>
                          update((p) => {
                            const aboutBlocks = [...p.aboutBlocks];
                            aboutBlocks[i] = { ...aboutBlocks[i]!, ctaLabel: e.target.value };
                            return { ...p, aboutBlocks };
                          })
                        }
                      />
                    </Field>
                    <Field label="Link CTA URL">
                      <input
                        className={INPUT}
                        value={block.ctaUrl}
                        onChange={(e) =>
                          update((p) => {
                            const aboutBlocks = [...p.aboutBlocks];
                            aboutBlocks[i] = { ...aboutBlocks[i]!, ctaUrl: e.target.value };
                            return { ...p, aboutBlocks };
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={SMALL_BTN}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    aboutBlocks: [
                      ...p.aboutBlocks,
                      {
                        id: `about_${Date.now()}`,
                        published: false,
                        heading: "",
                        body: "",
                        bullets: [],
                        imageUrl: "",
                        phoneCtaLabel: "",
                        ctaLabel: "",
                        ctaUrl: "",
                      },
                    ],
                  }))
                }
              >
                + Add block
              </button>
            </SectionCard>

            {/* 6. Patient reviews */}
            <SectionCard
              title="6 · Patient reviews"
              hint="Review cards shown on the page; manage the list below."
              published={doc.reviews.published}
              onPublishedChange={(v) =>
                update((p) => ({ ...p, reviews: { ...p.reviews, published: v } }))
              }
            >
              <Field label="Heading">
                <input
                  className={INPUT}
                  value={doc.reviews.heading}
                  onChange={(e) =>
                    update((p) => ({ ...p, reviews: { ...p.reviews, heading: e.target.value } }))
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={doc.reviews.linkToReviewsPage}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        reviews: { ...p.reviews, linkToReviewsPage: e.target.checked },
                      }))
                    }
                  />
                  Show link to reviews page
                </label>
                <Field label="Link URL">
                  <input
                    className={INPUT}
                    value={doc.reviews.reviewsUrl}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        reviews: { ...p.reviews, reviewsUrl: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Link label">
                  <input
                    className={INPUT}
                    value={doc.reviews.reviewsLinkLabel}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        reviews: { ...p.reviews, reviewsLinkLabel: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Reviews</h3>
                <PracticeTestimonialsPanel location={location} getIdToken={getIdToken} />
              </div>
            </SectionCard>

            {/* 7. Team strips */}
            <SectionCard
              title="7 · Meet our team"
              hint="Photos and credentials come from the doctors / office-staff sections of the site; edit those under Website. Each strip controls a heading, link, and which roster it shows."
            >
              {doc.teamSections.map((section: PracticeTeamSection, i) => (
                <div key={section.id || i} className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Strip {i + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={section.published}
                          onChange={(e) =>
                            update((p) => {
                              const teamSections = [...p.teamSections];
                              teamSections[i] = {
                                ...teamSections[i]!,
                                published: e.target.checked,
                              };
                              return { ...p, teamSections };
                            })
                          }
                        />
                        Published
                      </label>
                      <button
                        type="button"
                        className={SMALL_BTN}
                        onClick={() =>
                          update((p) => ({ ...p, teamSections: moveItem(p.teamSections, i, -1) }))
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={SMALL_BTN}
                        onClick={() =>
                          update((p) => ({ ...p, teamSections: moveItem(p.teamSections, i, 1) }))
                        }
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={`${SMALL_BTN} text-rose-700`}
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            teamSections: p.teamSections.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        Remove strip
                      </button>
                    </div>
                  </div>
                  <Field label="Heading">
                    <input
                      className={INPUT}
                      value={section.heading}
                      onChange={(e) =>
                        update((p) => {
                          const teamSections = [...p.teamSections];
                          teamSections[i] = { ...teamSections[i]!, heading: e.target.value };
                          return { ...p, teamSections };
                        })
                      }
                    />
                  </Field>
                  <Field label="Intro (optional)">
                    <textarea
                      className={TEXTAREA}
                      value={section.intro}
                      onChange={(e) =>
                        update((p) => {
                          const teamSections = [...p.teamSections];
                          teamSections[i] = { ...teamSections[i]!, intro: e.target.value };
                          return { ...p, teamSections };
                        })
                      }
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Roster">
                      <select
                        className={INPUT}
                        value={section.source}
                        onChange={(e) =>
                          update((p) => {
                            const teamSections = [...p.teamSections];
                            teamSections[i] = {
                              ...teamSections[i]!,
                              source: e.target.value as PracticeTeamSection["source"],
                            };
                            return { ...p, teamSections };
                          })
                        }
                      >
                        <option value="paris-doctors">Paris doctors</option>
                        <option value="ss-staff">Sulphur Springs staff</option>
                        <option value="rub-club-team">Rub Club massage team</option>
                      </select>
                    </Field>
                    <Field label="Style">
                      <select
                        className={INPUT}
                        value={section.variant}
                        onChange={(e) =>
                          update((p) => {
                            const teamSections = [...p.teamSections];
                            teamSections[i] = {
                              ...teamSections[i]!,
                              variant: e.target.value as PracticeTeamSection["variant"],
                            };
                            return { ...p, teamSections };
                          })
                        }
                      >
                        <option value="cards">Photo cards</option>
                        <option value="expanded">Expanded (full bios & videos)</option>
                      </select>
                    </Field>
                    <Field label="Link URL">
                      <input
                        className={INPUT}
                        value={section.linkUrl}
                        onChange={(e) =>
                          update((p) => {
                            const teamSections = [...p.teamSections];
                            teamSections[i] = { ...teamSections[i]!, linkUrl: e.target.value };
                            return { ...p, teamSections };
                          })
                        }
                      />
                    </Field>
                    <Field label="Link label">
                      <input
                        className={INPUT}
                        value={section.linkLabel}
                        onChange={(e) =>
                          update((p) => {
                            const teamSections = [...p.teamSections];
                            teamSections[i] = { ...teamSections[i]!, linkLabel: e.target.value };
                            return { ...p, teamSections };
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={SMALL_BTN}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    teamSections: [
                      ...p.teamSections,
                      {
                        id: `team_${Date.now()}`,
                        published: false,
                        heading: "",
                        intro: "",
                        source: "paris-doctors",
                        variant: "cards",
                        linkUrl: "",
                        linkLabel: "",
                      },
                    ],
                  }))
                }
              >
                + Add strip
              </button>
            </SectionCard>

            {/* 8. Location / contact */}
            <SectionCard
              title="8 · Location & contact"
              hint="Office info, hours table, and embedded map. Hours come from the existing hours fields (Website → Paris office / Sulphur Springs)."
              published={doc.locationBlock.published}
              onPublishedChange={(v) =>
                update((p) => ({ ...p, locationBlock: { ...p.locationBlock, published: v } }))
              }
            >
              <Field label="Heading">
                <input
                  className={INPUT}
                  value={doc.locationBlock.heading}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      locationBlock: { ...p.locationBlock, heading: e.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Map embed URL (Google Maps embed link)">
                <input
                  className={INPUT}
                  value={doc.locationBlock.mapEmbedUrl}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      locationBlock: { ...p.locationBlock, mapEmbedUrl: e.target.value },
                    }))
                  }
                />
              </Field>
              {location !== "sulphur-springs" ? (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={doc.locationBlock.showSecondaryLocations}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        locationBlock: {
                          ...p.locationBlock,
                          showSecondaryLocations: e.target.checked,
                        },
                      }))
                    }
                  />
                  Also show the second office card (Sulphur Springs)
                </label>
              ) : null}
            </SectionCard>

            {/* 9. Extras */}
            <SectionCard title="9 · Extra blocks" hint="Location-specific promos and link lists (wellness plans, awards, injuries, resources…). Each block has its own publish toggle. Wellness plan prices are edited in Website → Wellness care plans (scope=wellness).">
              {doc.extras.map((extra: PracticeExtra, i) => (
                <div key={extra.id || i} className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Block: {extra.id || `extra_${i}`}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={extra.published}
                          onChange={(e) =>
                            update((p) => {
                              const extras = [...p.extras];
                              extras[i] = { ...extras[i]!, published: e.target.checked };
                              return { ...p, extras };
                            })
                          }
                        />
                        Published
                      </label>
                      <button
                        type="button"
                        className={`${SMALL_BTN} text-rose-700`}
                        onClick={() =>
                          update((p) => ({ ...p, extras: p.extras.filter((_, j) => j !== i) }))
                        }
                      >
                        Remove block
                      </button>
                    </div>
                  </div>
                  <input
                    className={INPUT}
                    placeholder="Heading"
                    value={extra.heading}
                    onChange={(e) =>
                      update((p) => {
                        const extras = [...p.extras];
                        extras[i] = { ...extras[i]!, heading: e.target.value };
                        return { ...p, extras };
                      })
                    }
                  />
                  <textarea
                    className={`${INPUT} min-h-[60px]`}
                    placeholder="Body"
                    value={extra.body}
                    onChange={(e) =>
                      update((p) => {
                        const extras = [...p.extras];
                        extras[i] = { ...extras[i]!, body: e.target.value };
                        return { ...p, extras };
                      })
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={INPUT}
                      placeholder="Button label (optional)"
                      value={extra.ctaLabel}
                      onChange={(e) =>
                        update((p) => {
                          const extras = [...p.extras];
                          extras[i] = { ...extras[i]!, ctaLabel: e.target.value };
                          return { ...p, extras };
                        })
                      }
                    />
                    <input
                      className={INPUT}
                      placeholder="Button link"
                      value={extra.ctaUrl}
                      onChange={(e) =>
                        update((p) => {
                          const extras = [...p.extras];
                          extras[i] = { ...extras[i]!, ctaUrl: e.target.value };
                          return { ...p, extras };
                        })
                      }
                    />
                  </div>
                  <Field label="Links (one per line as Label | /url)">
                    <textarea
                      className={TEXTAREA}
                      value={extra.links.map((l) => `${l.label} | ${l.url}`).join("\n")}
                      onChange={(e) =>
                        update((p) => {
                          const extras = [...p.extras];
                          extras[i] = {
                            ...extras[i]!,
                            links: e.target.value
                              .split(/\r?\n/)
                              .map((line) => {
                                const [label = "", url = ""] = line.split("|").map((s) => s.trim());
                                return { label, url };
                              })
                              .filter((l) => l.label && l.url),
                          };
                          return { ...p, extras };
                        })
                      }
                    />
                  </Field>
                </div>
              ))}
              <button
                type="button"
                className={SMALL_BTN}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    extras: [
                      ...p.extras,
                      {
                        id: `extra_${Date.now()}`,
                        published: false,
                        heading: "",
                        body: "",
                        ctaLabel: "",
                        ctaUrl: "",
                        links: [],
                      },
                    ],
                  }))
                }
              >
                + Add block
              </button>
            </SectionCard>

            {/* 10. Sticky call bar */}
            <SectionCard
              title="10 · Sticky mobile call bar"
              hint="Fixed bottom bar on phones: Call Us + Book Now."
              published={doc.stickyCallBar.enabled}
              onPublishedChange={(v) =>
                update((p) => ({ ...p, stickyCallBar: { ...p.stickyCallBar, enabled: v } }))
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Call label">
                  <input
                    className={INPUT}
                    value={doc.stickyCallBar.callLabel}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        stickyCallBar: { ...p.stickyCallBar, callLabel: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className={INPUT}
                    value={doc.stickyCallBar.phone}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        stickyCallBar: { ...p.stickyCallBar, phone: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Book label">
                  <input
                    className={INPUT}
                    value={doc.stickyCallBar.bookLabel}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        stickyCallBar: { ...p.stickyCallBar, bookLabel: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Book link">
                  <input
                    className={INPUT}
                    value={doc.stickyCallBar.bookUrl}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        stickyCallBar: { ...p.stickyCallBar, bookUrl: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
            </SectionCard>
          </div>

          <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={() => void save()}
              className="rounded-full bg-[#c0392b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#962d22] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
            <button
              type="button"
              className="text-sm font-semibold text-slate-600 underline"
              onClick={() => {
                if (!dirty || window.confirm("Discard unsaved changes?")) void load();
              }}
            >
              Discard changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
