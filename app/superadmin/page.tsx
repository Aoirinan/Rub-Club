"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import type { PatientIntakeRow } from "@/lib/patient-record-lookup";
import type { BannerConfig, DoctorMediaItem, SiteEditableCopy, SiteOwnerSingleton, TestimonialVideoItem } from "@/lib/site-owner-config";
import { paymentStatusShort } from "@/app/admin/_scheduler/helpers";
import type { BookingRow } from "@/app/admin/_scheduler/types";

type Tab = "banner" | "videos" | "specials" | "doctor" | "siteinfo" | "reports" | "settings";

type OwnerAppointment = {
  id: string;
  startIso?: string | null;
  startAtMs?: number | null;
  name?: string;
  phone?: string;
  email?: string;
  serviceLine?: string;
  visitKind?: string;
  durationMin?: number | null;
  status?: string;
  confirmationStatus?: string;
  internalNotes?: string;
  locationId?: string;
  providerDisplayName?: string;
  prepaidOnline?: boolean;
  paymentLinkUrl?: string;
  paymentAmountCents?: number | null;
  paidAmountCents?: number | null;
  paidAtMs?: number | null;
  squarePaymentId?: string;
};

function schedHrefOwner(a: OwnerAppointment): string | null {
  if (typeof a.startAtMs === "number") {
    const dt = DateTime.fromMillis(a.startAtMs).setZone(TIME_ZONE);
    if (!dt.isValid) return null;
    return `/admin?date=${encodeURIComponent(dt.toFormat("yyyy-LL-dd"))}&focus=${encodeURIComponent(a.id)}`;
  }
  const iso = a.startIso;
  if (typeof iso === "string" && iso.length > 0) {
    const dt = DateTime.fromISO(iso, { zone: "utc" }).setZone(TIME_ZONE);
    if (!dt.isValid) return null;
    return `/admin?date=${encodeURIComponent(dt.toFormat("yyyy-LL-dd"))}&focus=${encodeURIComponent(a.id)}`;
  }
  return null;
}

function whenChicago(a: OwnerAppointment): string {
  if (typeof a.startAtMs === "number") {
    return DateTime.fromMillis(a.startAtMs).setZone(TIME_ZONE).toFormat("ccc LLL d yyyy · h:mm a");
  }
  if (typeof a.startIso === "string" && a.startIso.length > 0) {
    const dt = DateTime.fromISO(a.startIso, { zone: "utc" }).setZone(TIME_ZONE);
    return dt.isValid ? dt.toFormat("ccc LLL d yyyy · h:mm a") : "—";
  }
  return "—";
}

type BookingDoc = Record<string, unknown> & { id?: string };

function schedLink(b: BookingDoc): string | null {
  const startIso = typeof b.startIso === "string" ? b.startIso : null;
  if (!startIso) return null;
  const dt = DateTime.fromISO(startIso, { zone: "utc" }).setZone(TIME_ZONE);
  if (!dt.isValid) return null;
  const date = dt.toFormat("yyyy-LL-dd");
  const id = typeof b.id === "string" ? b.id : "";
  if (!id) return null;
  return `/admin?date=${encodeURIComponent(date)}&focus=${encodeURIComponent(id)}`;
}

export default function OwnerSuperAdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("banner");
  const [msg, setMsg] = useState<string | null>(null);
  const [config, setConfig] = useState<SiteOwnerSingleton | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportsFrom, setReportsFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportsTo, setReportsTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [appointments, setAppointments] = useState<OwnerAppointment[]>([]);
  const [patientPhone, setPatientPhone] = useState("");
  const [patientRecord, setPatientRecord] = useState<{
    bookings: Record<string, unknown>[];
    intakes: PatientIntakeRow[];
    smsLog: Record<string, unknown>[];
  } | null>(null);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/superadmin/config", { credentials: "include" });
    if (!res.ok) {
      setAuthed(false);
      return;
    }
    const data = (await res.json()) as { config: SiteOwnerSingleton; appVersion?: string };
    setConfig(data.config);
    setAppVersion(typeof data.appVersion === "string" ? data.appVersion : null);
    setAuthed(true);
  }, []);

  useEffect(() => {
    void loadConfig().catch(() => setAuthed(false));
  }, [loadConfig]);

  async function login() {
    setMsg(null);
    const res = await fetch("/api/superadmin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(d.error ?? "Login failed");
      return;
    }
    setPassword("");
    await loadConfig();
  }

  async function logout() {
    await fetch("/api/superadmin/logout", { method: "POST", credentials: "include" });
    setAuthed(false);
    setConfig(null);
  }

  async function saveBanner(patch: Partial<BannerConfig>) {
    if (!config) return;
    const banner = { ...config.banner, ...patch };
    const res = await fetch("/api/superadmin/config", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ banner }),
      credentials: "include",
    });
    const data = (await res.json()) as { config?: SiteOwnerSingleton; error?: string };
    if (!res.ok) {
      setMsg(data.error ?? "Save failed");
      return;
    }
    setConfig(data.config!);
    setMsg("Saved.");
  }

  async function saveSpecials() {
    if (!config) return;
    const res = await fetch("/api/superadmin/config", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ specials: config.specials }),
      credentials: "include",
    });
    const data = (await res.json()) as { config?: SiteOwnerSingleton; error?: string };
    if (!res.ok) {
      setMsg(data.error ?? "Save failed");
      return;
    }
    setConfig(data.config!);
    setMsg("Specials saved.");
  }

  async function saveEditableCopy() {
    if (!config) return;
    const res = await fetch("/api/superadmin/config", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ editableCopy: config.editableCopy }),
      credentials: "include",
    });
    const data = (await res.json()) as { config?: SiteOwnerSingleton; error?: string };
    if (!res.ok) {
      setMsg(data.error ?? "Save failed");
      return;
    }
    setConfig(data.config!);
    setMsg("Site info saved.");
  }

  async function uploadVideo(fd: FormData) {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/videos/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Upload failed");
        return;
      }
      await loadConfig();
      setMsg("Video uploaded.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteVideo(id: string) {
    const res = await fetch(`/api/superadmin/videos/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      setMsg("Delete failed");
      return;
    }
    await loadConfig();
  }

  const loadReports = useCallback(async () => {
    setMsg(null);
    const res = await fetch(
      `/api/superadmin/appointments?from=${encodeURIComponent(reportsFrom)}&to=${encodeURIComponent(reportsTo)}`,
      { credentials: "include" },
    );
    if (!res.ok) {
      setMsg("Could not load appointments.");
      return;
    }
    const data = (await res.json()) as { appointments: OwnerAppointment[] };
    setAppointments(data.appointments ?? []);
  }, [reportsFrom, reportsTo]);

  useEffect(() => {
    if (!authed || tab !== "reports") return;
    void loadReports();
  }, [authed, tab, loadReports]);

  async function saveNotes(id: string, internalNotes: string) {
    const res = await fetch(`/api/superadmin/bookings/${encodeURIComponent(id)}/internal-notes`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ internalNotes }),
      credentials: "include",
    });
    if (!res.ok) setMsg("Notes save failed");
    else setMsg("Notes saved.");
    await loadReports();
  }

  async function loadPatient() {
    setPatientRecord(null);
    const digits = patientPhone.replace(/\D/g, "");
    if (digits.length < 7) {
      setMsg("Enter a phone number (7+ digits).");
      return;
    }
    const res = await fetch(`/api/superadmin/patient?phone=${encodeURIComponent(patientPhone)}`, {
      credentials: "include",
    });
    if (!res.ok) {
      setMsg("Patient lookup failed.");
      return;
    }
    const data = (await res.json()) as {
      bookings?: Record<string, unknown>[];
      intakes?: PatientIntakeRow[];
      smsLog?: Record<string, unknown>[];
    };
    setPatientRecord({
      bookings: data.bookings ?? [],
      intakes: data.intakes ?? [],
      smsLog: data.smsLog ?? [],
    });
    setMsg(null);
  }

  async function downloadOwnerCsv() {
    setMsg(null);
    const res = await fetch(
      `/api/superadmin/bookings-export?from=${encodeURIComponent(reportsFrom)}&to=${encodeURIComponent(reportsTo)}`,
      { credentials: "include" },
    );
    if (!res.ok) {
      setMsg("CSV export failed.");
      return;
    }
    const blob = await res.blob();
    const cd = res.headers.get("content-disposition");
    const m = cd?.match(/filename="([^"]+)"/);
    const filename = m?.[1] ?? "bookings-export.csv";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("CSV downloaded.");
  }

  if (!authed || !config) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16">
        <h1 className="text-2xl font-black text-slate-900">Owner superadmin</h1>
        <p className="text-sm text-slate-600">Sign in with the owner password (not staff Firebase login).</p>
        <input
          type="password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void login()}
          className="rounded-full bg-[#0f5f5c] px-6 py-2 text-sm font-bold text-white"
        >
          Sign in
        </button>
        {msg ? <p className="text-sm text-amber-900">{msg}</p> : null}
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "banner", label: "Sales banner" },
    { id: "videos", label: "Testimonial videos" },
    { id: "specials", label: "Specials" },
    { id: "doctor", label: "Doctor media" },
    { id: "siteinfo", label: "Site info" },
    { id: "reports", label: "Bookings & patients" },
    { id: "settings", label: "Shortcuts" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-900">Owner superadmin</h1>
        <button type="button" onClick={() => void logout()} className="text-sm font-bold text-[#0f5f5c] underline">
          Sign out
        </button>
      </div>
      {msg ? <p className="text-sm text-slate-800">{msg}</p> : null}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              tab === t.id ? "bg-[#0f5f5c] text-white" : "bg-slate-100 text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "banner" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Homepage banner</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.banner.enabled}
              onChange={(e) => setConfig({ ...config, banner: { ...config.banner, enabled: e.target.checked } })}
            />
            Show banner (when not expired)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.banner.showOnHomepage}
              onChange={(e) =>
                setConfig({ ...config, banner: { ...config.banner, showOnHomepage: e.target.checked } })
              }
            />
            Show on website (home + main layout)
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Expiry (optional)</span>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              value={config.banner.expiresAt ?? ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  banner: { ...config.banner, expiresAt: e.target.value || null },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">HTML / text</span>
            <textarea
              className="mt-1 min-h-[120px] w-full rounded border border-slate-300 px-2 py-2 font-mono text-sm"
              value={config.banner.html}
              onChange={(e) => setConfig({ ...config, banner: { ...config.banner, html: e.target.value } })}
            />
          </label>
          <button
            type="button"
            onClick={() => void saveBanner(config.banner)}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white"
          >
            Save banner
          </button>
        </section>
      ) : null}

      {tab === "videos" ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Testimonial videos</h2>
          <form
            className="grid gap-2 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void uploadVideo(fd);
              e.currentTarget.reset();
            }}
          >
            <label className="text-sm sm:col-span-2">
              Video file (mp4/mov/webm, max 200MB)
              <input name="file" type="file" accept="video/mp4,video/quicktime,video/webm" required className="mt-1 block w-full text-sm" />
            </label>
            <label className="text-sm">
              Title (optional)
              <input name="title" className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label className="text-sm">
              Patient label (optional)
              <input name="label" className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-2 rounded-full bg-[#0f5f5c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Uploading…" : "Upload"}
            </button>
          </form>
          <ul className="divide-y divide-slate-100 text-sm">
            {config.testimonialVideos.map((v: TestimonialVideoItem) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {v.title || "Untitled"} — {v.label || "—"}
                </span>
                <button type="button" className="text-red-700 underline" onClick={() => void deleteVideo(v.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "specials" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Domain specials (HTML)</h2>
          {(["massageHtml", "chiroHtml", "generalHtml"] as const).map((key) => (
            <label key={key} className="block text-sm font-semibold">
              {key}
              <textarea
                className="mt-1 min-h-[100px] w-full rounded border px-2 py-2 font-mono text-xs"
                value={config.specials[key]}
                onChange={(e) =>
                  setConfig({ ...config, specials: { ...config.specials, [key]: e.target.value } })
                }
              />
            </label>
          ))}
          <button type="button" onClick={() => void saveSpecials()} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white">
            Save specials
          </button>
        </section>
      ) : null}

      {tab === "doctor" ? (
        <DoctorMediaTab
          items={config.doctorMedia}
          onReload={loadConfig}
          onMessage={setMsg}
        />
      ) : null}

      {tab === "siteinfo" ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Site-wide phones & snippets</h2>
          <p className="text-sm text-slate-600">
            Leave a field blank to keep the built-in default from the codebase. Gift card URL must start with{" "}
            <code className="font-mono text-xs">http://</code> or <code className="font-mono text-xs">https://</code>.
          </p>
          {(
            [
              ["parisChiroPhone", "Paris chiropractic main line"],
              ["sulphurChiroPhone", "Sulphur Springs chiropractic line"],
              ["rubClubMassagePhone", "Paris massage desk (shown as “The Rub Club” in the header)"],
              ["giftCardOrderUrl", "Square gift card order URL"],
            ] as const satisfies ReadonlyArray<readonly [keyof SiteEditableCopy, string]>
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="font-semibold">{label}</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
                value={config.editableCopy[key]}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    editableCopy: { ...config.editableCopy, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
          <label className="block text-sm">
            <span className="font-semibold">Homepage awards strip (HTML)</span>
            <textarea
              className="mt-1 min-h-[72px] w-full rounded border border-slate-300 px-2 py-2 font-mono text-xs"
              value={config.editableCopy.awardsStripHtml}
              onChange={(e) =>
                setConfig({
                  ...config,
                  editableCopy: { ...config.editableCopy, awardsStripHtml: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Footer intro column (HTML)</span>
            <textarea
              className="mt-1 min-h-[100px] w-full rounded border border-slate-300 px-2 py-2 font-mono text-xs"
              value={config.editableCopy.footerBlurbHtml}
              onChange={(e) =>
                setConfig({
                  ...config,
                  editableCopy: { ...config.editableCopy, footerBlurbHtml: e.target.value },
                })
              }
            />
          </label>
          <button
            type="button"
            onClick={() => void saveEditableCopy()}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white"
          >
            Save site info
          </button>
        </section>
      ) : null}

      {tab === "reports" ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Appointments</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input type="date" value={reportsFrom} onChange={(e) => setReportsFrom(e.target.value)} className="rounded border px-2 py-1" />
            <input type="date" value={reportsTo} onChange={(e) => setReportsTo(e.target.value)} className="rounded border px-2 py-1" />
            <button
              type="button"
              onClick={() => void loadReports()}
              className="rounded-full bg-slate-900 px-4 py-1 text-xs font-bold text-white"
            >
              Load
            </button>
            <button
              type="button"
              onClick={() => void downloadOwnerCsv()}
              className="rounded-full border border-slate-300 bg-white px-4 py-1 text-xs font-bold text-slate-900 hover:bg-slate-50"
            >
              Download CSV
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Times are shown in Chicago. CSV matches staff export columns (notes, pay status, Square id, etc.). Adjust
            dates and use Load, or switch away from this tab and back to refresh.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="p-2">When (Chicago)</th>
                  <th className="p-2">Patient</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Provider</th>
                  <th className="p-2">Location</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Online</th>
                  <th className="p-2">Pay</th>
                  <th className="p-2">Internal notes</th>
                  <th className="p-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const sched = schedHrefOwner(a);
                  const pay = paymentStatusShort(a as BookingRow);
                  return (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="max-w-[160px] p-2 whitespace-pre-wrap text-slate-800">{whenChicago(a)}</td>
                      <td className="p-2 font-medium">
                        {a.phone && a.phone.replace(/\D/g, "").length >= 7 ? (
                          <Link
                            href={`/admin/patient?phone=${encodeURIComponent(a.phone)}`}
                            className="text-sky-800 underline hover:text-sky-950"
                          >
                            {a.name ?? "—"}
                          </Link>
                        ) : (
                          a.name ?? "—"
                        )}
                      </td>
                      <td className="p-2 whitespace-nowrap">{a.phone || "—"}</td>
                      <td className="p-2 capitalize">{a.serviceLine || "—"}</td>
                      <td className="p-2">{a.providerDisplayName || "—"}</td>
                      <td className="p-2">
                        {a.locationId === "paris"
                          ? "Paris"
                          : a.locationId === "sulphur_springs"
                            ? "Sulphur Springs"
                            : a.locationId || "—"}
                      </td>
                      <td className="p-2">{a.status}</td>
                      <td className="p-2">
                        {a.confirmationStatus === "confirmed_online"
                          ? "Yes"
                          : a.status === "pending" || a.status === "confirmed"
                            ? "No"
                            : "—"}
                      </td>
                      <td className="p-2 whitespace-nowrap">{pay}</td>
                      <td className="p-2">
                        <textarea
                          key={`${a.id}-${a.internalNotes ?? ""}`}
                          defaultValue={a.internalNotes ?? ""}
                          className="min-w-[10rem] max-w-[14rem] rounded border px-1 py-1"
                          maxLength={2000}
                          rows={2}
                          onBlur={(e) => {
                            if (e.target.value !== (a.internalNotes ?? "")) void saveNotes(a.id, e.target.value);
                          }}
                        />
                      </td>
                      <td className="space-y-1 p-2 align-top">
                        {sched ? (
                          <Link href={sched} className="block text-sky-800 underline">
                            Scheduler
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        <button
                          type="button"
                          className="block text-left text-[10px] font-semibold text-slate-600 underline"
                          onClick={() =>
                            void navigator.clipboard.writeText(a.id).then(
                              () => setMsg("Booking ID copied."),
                              () => setMsg("Could not copy ID."),
                            )
                          }
                        >
                          Copy ID
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <h3 className="pt-6 text-base font-bold">Patient lookup (phone)</h3>
          <div className="flex flex-wrap gap-2">
            <input
              className="rounded border px-2 py-1"
              placeholder="903-555-1234"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
            />
            <button type="button" onClick={() => void loadPatient()} className="rounded-full bg-slate-900 px-4 py-1 text-xs font-bold text-white">
              Lookup
            </button>
          </div>
          {patientRecord ? (
            <div className="mt-4 max-h-[32rem] space-y-4 overflow-y-auto text-sm">
              <div className="rounded-xl border border-slate-200 bg-white">
                <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  Appointments ({patientRecord.bookings.length})
                </p>
                {patientRecord.bookings.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-slate-600">No bookings for this phone.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {patientRecord.bookings.map((b) => {
                      const doc = b as BookingDoc;
                      const name = typeof doc.name === "string" ? doc.name : "—";
                      const status = typeof doc.status === "string" ? doc.status : "—";
                      const svc = typeof doc.serviceLine === "string" ? doc.serviceLine : "—";
                      const when =
                        typeof doc.startIso === "string"
                          ? DateTime.fromISO(doc.startIso, { zone: "utc" })
                              .setZone(TIME_ZONE)
                              .toFormat("ccc LLL d yyyy · h:mm a")
                          : "—";
                      const href = schedLink(doc);
                      return (
                        <li key={String(doc.id)} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                          <div>
                            <p className="font-medium text-slate-900">{when}</p>
                            <p className="text-xs text-slate-600">
                              {name} · <span className="capitalize">{svc}</span> · {status}
                            </p>
                          </div>
                          {href ? (
                            <Link href={href} className="text-xs font-semibold text-sky-800 underline">
                              Scheduler
                            </Link>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white">
                <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  Intake / insurance ({patientRecord.intakes.length})
                </p>
                {patientRecord.intakes.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-slate-600">No intake forms for this phone.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {patientRecord.intakes.map((row) => (
                      <li key={row.id} className="space-y-2 px-3 py-3">
                        <p className="text-xs font-medium text-slate-900">
                          {[row.firstName, row.lastName].filter(Boolean).join(" ") || "Intake"}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {row.insuranceFrontUrl ? (
                            <a
                              href={row.insuranceFrontUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-sky-800 underline"
                            >
                              Insurance front
                            </a>
                          ) : null}
                          {row.insuranceBackUrl ? (
                            <a
                              href={row.insuranceBackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-sky-800 underline"
                            >
                              Insurance back
                            </a>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white">
                <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  SMS log ({patientRecord.smsLog.length})
                </p>
                {patientRecord.smsLog.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-slate-600">No SMS records (or index still building).</p>
                ) : (
                  <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto">
                    {patientRecord.smsLog.map((row) => {
                      const msg = typeof row.message === "string" ? row.message : "";
                      const id = typeof row.id === "string" ? row.id : "";
                      return (
                        <li key={id || msg.slice(0, 40)} className="px-3 py-2 text-xs text-slate-700">
                          <p className="whitespace-pre-line">{msg}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "settings" ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Shortcuts</h2>
          {appVersion ? (
            <p className="text-xs text-slate-600">
              Deployed app version: <span className="font-mono font-semibold text-slate-900">{appVersion}</span>
            </p>
          ) : null}
          <p>Staff tools use Firebase login (not this owner password):</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            <li>
              <Link href="/admin" className="font-semibold text-sky-800 underline">
                Staff scheduler
              </Link>
            </li>
            <li>
              <Link href="/admin/reports" className="font-semibold text-sky-800 underline">
                Staff reports & appointment lookup
              </Link>
            </li>
            <li>
              <Link href="/admin/patient" className="font-semibold text-sky-800 underline">
                Staff patient record
              </Link>
            </li>
            <li>
              <Link href="/admin/super" className="font-semibold text-sky-800 underline">
                Staff super (invites, etc.)
              </Link>
            </li>
          </ul>
          <p className="border-t border-slate-100 pt-3">Public site (opens in same tab):</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            <li>
              <Link href="/" className="font-semibold text-sky-800 underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/book" className="font-semibold text-sky-800 underline">
                Book massage / stretch
              </Link>
            </li>
            <li>
              <Link href="/reviews" className="font-semibold text-sky-800 underline">
                Reviews
              </Link>
            </li>
            <li>
              <Link href="/patient-forms" className="font-semibold text-sky-800 underline">
                Patient forms
              </Link>
            </li>
            <li>
              <Link href="/services/chiropractic" className="font-semibold text-sky-800 underline">
                Chiropractic services
              </Link>
            </li>
            <li>
              <Link href="/services/massage" className="font-semibold text-sky-800 underline">
                Massage services
              </Link>
            </li>
          </ul>
          <p className="text-xs text-slate-500">
            This panel covers banner, videos, specials, doctor media, site-wide phones and HTML snippets, bookings
            export, and patient lookup. Ask your developer if you need deeper page-by-page SEO or insurance copy
            changes.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function DoctorMediaTab({
  items,
  onReload,
  onMessage,
}: {
  items: DoctorMediaItem[];
  onReload: () => Promise<void>;
  onMessage: (s: string | null) => void;
}) {
  const [doctorKey, setDoctorKey] = useState<DoctorMediaItem["doctorKey"]>("greg");
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      onMessage("Choose a file first.");
      return;
    }
    setBusy(true);
    onMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("doctorKey", doctorKey);
      fd.append("mediaType", mediaType);
      fd.append("caption", caption);
      const res = await fetch("/api/superadmin/doctor-media/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onMessage(data.error ?? "Upload failed");
        return;
      }
      onMessage("Uploaded.");
      setFile(null);
      setCaption("");
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === id);
    const next = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= next.length) return;
    const tmp = next[idx]!;
    next[idx] = next[j]!;
    next[j] = tmp;
    const orderedIds = next.map((x) => x.id);
    await fetch("/api/superadmin/doctor-media/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderedIds }),
      credentials: "include",
    });
    await onReload();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">Doctor media (adjustments)</h2>
      <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          Doctor
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={doctorKey}
            onChange={(e) => setDoctorKey(e.target.value as DoctorMediaItem["doctorKey"])}
          >
            <option value="greg">Dr. Greg Thompson</option>
            <option value="sean">Dr. Sean Welborn</option>
            <option value="brandy">Dr. Brandy Collins</option>
          </select>
        </label>
        <label className="text-sm">
          Media type
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as "photo" | "video")}
          >
            <option value="photo">Photo</option>
            <option value="video">Video</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Caption
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          File
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            required
            className="mt-1 block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="sm:col-span-2 rounded-full bg-[#0f5f5c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>
      <ul className="text-sm">
        {[...items]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 border-t border-slate-100 py-2">
              <span className="font-mono text-xs">{m.id.slice(0, 8)}</span>
              <button type="button" className="text-xs underline" onClick={() => void move(m.id, -1)}>
                Up
              </button>
              <button type="button" className="text-xs underline" onClick={() => void move(m.id, 1)}>
                Down
              </button>
              <form
                className="inline"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch(`/api/superadmin/doctor-media/${encodeURIComponent(m.id)}`, {
                    method: "DELETE",
                    credentials: "include",
                  });
                  await onReload();
                }}
              >
                <button type="submit" className="text-xs text-red-700 underline">
                  Delete
                </button>
              </form>
            </li>
          ))}
      </ul>
    </section>
  );
}
