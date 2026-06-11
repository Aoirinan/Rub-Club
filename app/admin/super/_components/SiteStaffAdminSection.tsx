"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Auth } from "firebase/auth";
import type { SiteStaffBrand, SiteStaffMemberStored } from "@/lib/site-staff";

type Props = {
  auth: Auth | null;
  onNotify: (message: string | null) => void;
  /** When set (Website editor â†’ Paris/Sulphur staff), list and add form target one location. */
  locationFocus?: "paris" | "sulphur";
};

type BrandFilter = "all" | SiteStaffBrand;

async function parseAdminJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function brandLabel(brand: SiteStaffBrand): string {
  if (brand === "paris") return "Paris";
  if (brand === "sulphur") return "Sulphur Springs";
  return "Both locations";
}

export function SiteStaffAdminSection({ auth, onNotify, locationFocus }: Props) {
  const [members, setMembers] = useState<SiteStaffMemberStored[]>([]);
  const [siteUsesCustomList, setSiteUsesCustomList] = useState(false);
  const [brandFilter, setBrandFilter] = useState<BrandFilter>(locationFocus ?? "all");
  const [sectionAlert, setSectionAlert] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newBrand, setNewBrand] = useState<SiteStaffBrand>(locationFocus ?? "paris");
  const [newSpecialties, setNewSpecialties] = useState("");
  const [newFeatured, setNewFeatured] = useState(false);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);

  const [editing, setEditing] = useState<SiteStaffMemberStored | null>(null);
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editBrand, setEditBrand] = useState<SiteStaffBrand>("paris");
  const [editActive, setEditActive] = useState(true);
  const [editFeatured, setEditFeatured] = useState(false);
  const [editSpecialties, setEditSpecialties] = useState("");
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editVideo, setEditVideo] = useState<File | null>(null);
  const [editRemoveVideo, setEditRemoveVideo] = useState(false);

  const load = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) {
      setMembers([]);
      setSiteUsesCustomList(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/site-staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : `Could not load staff (HTTP ${res.status}).`;
        setSectionAlert({ kind: "error", text: msg });
        setMembers([]);
        setSiteUsesCustomList(false);
        return;
      }
      setMembers((data.members as SiteStaffMemberStored[] | undefined) ?? []);
      setSiteUsesCustomList(Boolean(data.siteUsesCustomList));
    } catch {
      setSectionAlert({
        kind: "error",
        text: "Network error while loading staff.",
      });
      setMembers([]);
      setSiteUsesCustomList(false);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!locationFocus) return;
    setBrandFilter(locationFocus);
    setNewBrand(locationFocus);
  }, [locationFocus]);

  const filteredMembers = useMemo(() => {
    if (brandFilter === "all") return members;
    return members.filter((m) => m.brand === brandFilter || m.brand === "both");
  }, [members, brandFilter]);

  async function postReorder(orderedIds: string[]) {
    const user = auth?.currentUser;
    if (!user) return;
    setReordering(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/site-staff/reorder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        setSectionAlert({
          kind: "error",
          text: typeof data.error === "string" ? data.error : "Could not reorder.",
        });
        return;
      }
      await load();
    } finally {
      setReordering(false);
    }
  }

  function moveMember(id: string, direction: -1 | 1) {
    const idx = members.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= members.length) return;
    const next = [...members];
    const tmp = next[idx];
    next[idx] = next[target]!;
    next[target] = tmp!;
    void postReorder(next.map((m) => m.id));
  }

  async function seedDefaults() {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (
      !window.confirm(
        "Import Paris and Sulphur staff from the current website? You can edit the list here afterward.",
      )
    ) {
      return;
    }
    setSeeding(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/site-staff", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ seedDefaults: true }),
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        setSectionAlert({
          kind: "error",
          text: typeof data.error === "string" ? data.error : "Could not import staff.",
        });
        return;
      }
      setSectionAlert({
        kind: "success",
        text: "Staff imported. Paris and Sulphur Springs staff pages now use this list.",
      });
      await load();
    } finally {
      setSeeding(false);
    }
  }

  async function createMember() {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (!newName.trim() || !newTitle.trim()) {
      setSectionAlert({ kind: "error", text: "Name and title are required." });
      return;
    }
    if (!newPhoto) {
      setSectionAlert({ kind: "error", text: "Choose a portrait image." });
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const form = new FormData();
      form.set("name", newName.trim());
      form.set("title", newTitle.trim());
      form.set("bio", newBio.trim());
      form.set("brand", newBrand);
      if (newSpecialties.trim()) form.set("specialties", newSpecialties.trim());
      if (newFeatured) form.set("featured", "true");
      form.set("photo", newPhoto);
      if (newVideo) form.set("video", newVideo);
      const res = await fetch("/api/admin/site-staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        setSectionAlert({
          kind: "error",
          text: typeof data.error === "string" ? data.error : "Could not add staff member.",
        });
        return;
      }
      setNewName("");
      setNewTitle("");
      setNewBio("");
      setNewSpecialties("");
      setNewFeatured(false);
      setNewPhoto(null);
      setNewVideo(null);
      await load();
      setSectionAlert({ kind: "success", text: "Staff member added." });
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user || !editing) return;
    if (!editName.trim() || !editTitle.trim()) {
      setSectionAlert({ kind: "error", text: "Name and title are required." });
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      if (editPhoto || editVideo) {
        const form = new FormData();
        form.set("name", editName.trim());
        form.set("title", editTitle.trim());
        form.set("bio", editBio.trim());
        form.set("brand", editBrand);
        form.set("active", editActive ? "true" : "false");
        form.set("featured", editFeatured ? "true" : "false");
        form.set("specialties", editSpecialties.trim());
        if (editPhoto) form.set("photo", editPhoto);
        if (editVideo) form.set("video", editVideo);
        if (editRemoveVideo && !editVideo) form.set("removeVideo", "true");
        const res = await fetch(`/api/admin/site-staff/${encodeURIComponent(editing.id)}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await parseAdminJson(res);
        if (!res.ok) {
          setSectionAlert({
            kind: "error",
            text: typeof data.error === "string" ? data.error : "Could not save.",
          });
          return;
        }
      } else {
        const res = await fetch(`/api/admin/site-staff/${encodeURIComponent(editing.id)}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            title: editTitle.trim(),
            bio: editBio.trim(),
            brand: editBrand,
            active: editActive,
            featured: editFeatured,
            specialties: editSpecialties
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            ...(editRemoveVideo ? { removeVideo: true } : {}),
          }),
        });
        const data = await parseAdminJson(res);
        if (!res.ok) {
          setSectionAlert({
            kind: "error",
            text: typeof data.error === "string" ? data.error : "Could not save.",
          });
          return;
        }
      }
      setSectionAlert({ kind: "success", text: "Saved." });
      setEditing(null);
      setEditPhoto(null);
      setEditVideo(null);
      setEditRemoveVideo(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(row: SiteStaffMemberStored) {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (!window.confirm(`Remove "${row.name}" from the website staff list?`)) return;
    setDeletingId(row.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/site-staff/${encodeURIComponent(row.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        setSectionAlert({
          kind: "error",
          text: typeof data.error === "string" ? data.error : "Could not delete.",
        });
        return;
      }
      if (editing?.id === row.id) setEditing(null);
      await load();
      setSectionAlert({ kind: "success", text: "Removed." });
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(row: SiteStaffMemberStored) {
    setSectionAlert(null);
    onNotify(null);
    setEditing(row);
    setEditName(row.name);
    setEditTitle(row.title);
    setEditBio(row.bio);
    setEditBrand(row.brand);
    setEditActive(row.active);
    setEditFeatured(row.featured);
    setEditSpecialties(row.specialties.join(", "));
    setEditPhoto(null);
    setEditVideo(null);
    setEditRemoveVideo(false);
  }

  const staffPath =
    locationFocus === "sulphur"
      ? "/sulphur-springs/staff"
      : locationFocus === "paris"
        ? "/locations/paris/staff"
        : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {locationFocus === "paris"
            ? "Office staff â€” Paris"
            : locationFocus === "sulphur"
              ? "Office staff â€” Sulphur Springs"
              : "Office staff â€” Paris & Sulphur Springs"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {staffPath ? (
            <>
              Manage who appears on{" "}
              <code className="rounded bg-slate-100 px-1">{staffPath}</code>.
            </>
          ) : (
            <>
              Manage who appears on{" "}
              <code className="rounded bg-slate-100 px-1">/locations/paris/staff</code> and{" "}
              <code className="rounded bg-slate-100 px-1">/sulphur-springs/staff</code>.
            </>
          )}{" "}
          Massage therapists are managed separately in Website editor â†’ Massage page.
        </p>
        {sectionAlert ? (
          <div
            role={sectionAlert.kind === "error" ? "alert" : "status"}
            className={
              sectionAlert.kind === "error"
                ? "mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950"
                : "mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
            }
          >
            {sectionAlert.text}
          </div>
        ) : null}
        {loading ? (
          <p className="mt-2 text-xs text-slate-500">Loadingâ€¦</p>
        ) : siteUsesCustomList ? (
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
            Your staff {locationFocus ? "page is" : "pages are"} live (
            {filteredMembers.length} {filteredMembers.length === 1 ? "person" : "people"}
            {locationFocus ? "" : ` of ${members.length} total`}).
          </p>
        ) : (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Using the default list â€” import or add someone to customize.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={seeding || siteUsesCustomList || loading}
          onClick={() => void seedDefaults()}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {seeding ? "Importingâ€¦" : "Import people already on the website"}
        </button>
      </div>

      {!locationFocus ? (
        <div className="flex flex-wrap gap-2">
          {(["all", "paris", "sulphur", "both"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setBrandFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                brandFilter === key
                  ? "bg-[#015949] text-white"
                  : "border border-slate-300 bg-white text-slate-800"
              }`}
            >
              {key === "all" ? "All" : brandLabel(key)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
        <p className="text-sm font-medium text-slate-800">Add staff member</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">Name</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">Job title</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">Bio (optional)</span>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">Location</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value as SiteStaffBrand)}
            >
              <option value="paris">Paris office</option>
              <option value="sulphur">Sulphur Springs</option>
              <option value="both">Both locations</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">Specialties (comma-separated, optional)</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={newSpecialties}
              onChange={(e) => setNewSpecialties(e.target.value)}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={newFeatured}
            onChange={(e) => setNewFeatured(e.target.checked)}
          />
          <span>Featured hero (Sulphur Springs staff page)</span>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">Portrait</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-sm"
            onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">
            Intro video (optional â€” shows a &ldquo;Meet&rdquo; button under their name)
          </span>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="w-full text-sm"
            onChange={(e) => setNewVideo(e.target.files?.[0] ?? null)}
          />
          <span className="block text-xs text-slate-500">MP4, MOV, or WebM â€” max 80 MB.</span>
        </label>
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void createMember()}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Savingâ€¦" : "Add staff member"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm">
          <p className="font-medium text-slate-900">Edit staff member</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="font-medium text-slate-800">Name</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="font-medium text-slate-800">Job title</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">Bio</span>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">Location</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={editBrand}
              onChange={(e) => setEditBrand(e.target.value as SiteStaffBrand)}
            >
              <option value="paris">Paris office</option>
              <option value="sulphur">Sulphur Springs</option>
              <option value="both">Both locations</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">Specialties</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={editSpecialties}
              onChange={(e) => setEditSpecialties(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              <span>Active on public site</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editFeatured}
                onChange={(e) => setEditFeatured(e.target.checked)}
              />
              <span>Featured hero (Sulphur)</span>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">New portrait (optional)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full text-sm"
              onChange={(e) => setEditPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">
              {editing.videoUrl ? "Replace intro video (optional)" : "Intro video (optional)"}
            </span>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="w-full text-sm"
              onChange={(e) => setEditVideo(e.target.files?.[0] ?? null)}
            />
            <span className="block text-xs text-slate-500">
              MP4, MOV, or WebM â€” max 80 MB. Shows a &ldquo;Meet&rdquo; button under their name on the website.
            </span>
          </label>
          {editing.videoUrl && !editVideo ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editRemoveVideo}
                onChange={(e) => setEditRemoveVideo(e.target.checked)}
              />
              <span>Remove current intro video</span>
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveEdit()}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setEditPhoto(null);
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <ul className="space-y-2 text-sm text-slate-700">
        {filteredMembers.map((m) => {
          const globalIndex = members.findIndex((x) => x.id === m.id);
          return (
            <li
              key={m.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                {m.photoUrl ? (
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.photoUrl} alt="" className="h-full w-full object-cover object-top" />
                  </div>
                ) : null}
                <div className="min-w-0 space-y-1">
                  <div className="font-semibold text-slate-900">
                    {m.name}
                    {!m.active ? (
                      <span className="ml-2 text-xs font-normal text-amber-800">(hidden)</span>
                    ) : null}
                    {m.featured ? (
                      <span className="ml-2 text-xs font-normal text-[#015949]">(featured)</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-600">
                    {m.title} Â· {brandLabel(m.brand)} Â· order {m.order}
                    {m.videoUrl ? " Â· has intro video" : ""}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={reordering || globalIndex <= 0}
                  onClick={() => moveMember(m.id, -1)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
                  aria-label="Move up"
                >
                  â†‘
                </button>
                <button
                  type="button"
                  disabled={reordering || globalIndex < 0 || globalIndex >= members.length - 1}
                  onClick={() => moveMember(m.id, 1)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
                  aria-label="Move down"
                >
                  â†“
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(m)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={deletingId === m.id}
                  onClick={() => void deleteMember(m)}
                  className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                >
                  {deletingId === m.id ? "Removingâ€¦" : "Delete"}
                </button>
              </div>
            </li>
          );
        })}
        {!loading && filteredMembers.length === 0 ? (
          <li className="text-slate-600">No staff in this filter.</li>
        ) : null}
      </ul>
    </section>
  );
}
