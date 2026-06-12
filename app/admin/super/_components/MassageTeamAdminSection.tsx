"use client";

import { useCallback, useEffect, useState } from "react";
import type { Auth } from "firebase/auth";
import type { MassageTeamMemberStored } from "@/lib/massage-team";

type Props = {
  auth: Auth | null;
  onNotify: (message: string | null) => void;
};

async function parseAdminJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function MassageTeamAdminSection({ auth, onNotify }: Props) {
  const [members, setMembers] = useState<MassageTeamMemberStored[]>([]);
  const [siteUsesCustomList, setSiteUsesCustomList] = useState(false);
  const [sectionAlert, setSectionAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [syncingProviders, setSyncingProviders] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSort, setNewSort] = useState("");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);

  const [editing, setEditing] = useState<MassageTeamMemberStored | null>(null);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editSort, setEditSort] = useState("");
  const [editPhoto, setEditPhoto] = useState<File | null>(null);

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
      const res = await fetch("/api/admin/massage-team", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        const apiError = typeof data.error === "string" ? data.error : null;
        const msg =
          apiError ??
          (res.status === 401
            ? "Not authorized to load the team list. You need manager access."
            : `Could not load team (HTTP ${res.status}).`);
        setSectionAlert({ kind: "error", text: msg });
        setMembers([]);
        setSiteUsesCustomList(false);
        return;
      }
      setMembers((data.members as MassageTeamMemberStored[] | undefined) ?? []);
      setSiteUsesCustomList(Boolean(data.siteUsesCustomList));
    } catch {
      setSectionAlert({
        kind: "error",
        text: "Network error while loading the team list. Check your connection and try again.",
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

  async function seedDefaults() {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (
      !window.confirm(
        "Import the default massage team from the website? After this, the home page and massage page use this list.",
      )
    ) {
      return;
    }
    setSeeding(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/massage-team", {
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
          text: typeof data.error === "string" ? data.error : "Could not import team.",
        });
        return;
      }
      setSectionAlert({
        kind: "success",
        text: "Team imported. The home page and massage page now use this list.",
      });
      await load();
    } finally {
      setSeeding(false);
    }
  }

  async function syncFromBookableProviders() {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (
      !window.confirm(
        "Copy active massage providers from the scheduling list into this website team? Existing team members with the same name are skipped. You can edit bios and portraits afterward.",
      )
    ) {
      return;
    }
    setSyncingProviders(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/massage-team", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ syncFromProviders: true }),
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        setSectionAlert({
          kind: "error",
          text: typeof data.error === "string" ? data.error : "Could not sync from providers.",
        });
        return;
      }
      const added = typeof data.added === "number" ? data.added : 0;
      const skipped = typeof data.skipped === "number" ? data.skipped : 0;
      setSectionAlert({
        kind: "success",
        text: `Added ${added} therapist${added === 1 ? "" : "s"} to the website team${skipped > 0 ? ` (${skipped} already listed).` : "."} Public pages and testimonial videos now use this list.`,
      });
      await load();
    } finally {
      setSyncingProviders(false);
    }
  }

  async function clearAll() {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (
      !window.confirm(
        "Remove everyone from your custom team list? The site will show the default team until you add or import people again.",
      )
    ) {
      return;
    }
    setClearing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/massage-team?all=1", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        setSectionAlert({
          kind: "error",
          text: typeof data.error === "string" ? data.error : "Could not clear team.",
        });
        return;
      }
      setSectionAlert({
        kind: "success",
        text: "Custom team removed. The site is using the default list again until you add or import.",
      });
      setEditing(null);
      await load();
    } finally {
      setClearing(false);
    }
  }

  async function createMember() {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (!newName.trim() || !newBio.trim()) {
      setSectionAlert({ kind: "error", text: "Name and bio are required." });
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
      form.set("bio", newBio.trim());
      if (newRole.trim()) form.set("role", newRole.trim());
      if (newSort.trim()) {
        const n = Number(newSort);
        if (Number.isFinite(n)) form.set("sortOrder", String(n));
      }
      form.set("photo", newPhoto);
      const res = await fetch("/api/admin/massage-team", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await parseAdminJson(res);
      if (!res.ok) {
        setSectionAlert({
          kind: "error",
          text:
            typeof data.error === "string"
              ? data.error
              : `Could not add team member (HTTP ${res.status}).`,
        });
        return;
      }
      setNewName("");
      setNewBio("");
      setNewRole("");
      setNewSort("");
      setNewPhoto(null);
      await load();
      setSectionAlert({
        kind: "success",
        text: "Team member added. They appear in â€œMeet the teamâ€ on the home page and on /services/massage.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user || !editing) return;
    if (!editName.trim() || !editBio.trim()) {
      setSectionAlert({ kind: "error", text: "Name and bio are required." });
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      if (editPhoto) {
        const form = new FormData();
        form.set("name", editName.trim());
        form.set("bio", editBio.trim());
        form.set("role", editRole.trim());
        const sn = Number(editSort);
        if (editSort.trim() !== "" && Number.isFinite(sn)) {
          form.set("sortOrder", String(sn));
        }
        form.set("photo", editPhoto);
        const res = await fetch(`/api/admin/massage-team/${encodeURIComponent(editing.id)}`, {
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
        const sn = Number(editSort);
        const body: {
          name: string;
          bio: string;
          role: string | null;
          sortOrder?: number;
        } = {
          name: editName.trim(),
          bio: editBio.trim(),
          role: editRole.trim() || null,
        };
        if (editSort.trim() !== "" && Number.isFinite(sn)) {
          body.sortOrder = sn;
        }
        const res = await fetch(`/api/admin/massage-team/${encodeURIComponent(editing.id)}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
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
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(row: MassageTeamMemberStored) {
    setSectionAlert(null);
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (!window.confirm(`Remove "${row.name}" from the public massage team?`)) return;
    setDeletingId(row.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/massage-team/${encodeURIComponent(row.id)}`, {
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
      setSectionAlert({ kind: "success", text: "Removed from site." });
      if (editing?.id === row.id) setEditing(null);
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(row: MassageTeamMemberStored) {
    setSectionAlert(null);
    onNotify(null);
    setEditing(row);
    setEditName(row.name);
    setEditBio(row.bio);
    setEditRole(row.role ?? "");
    setEditSort(String(row.sortOrder));
    setEditPhoto(null);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Massage team (Meet the team)</h2>
        <p className="mt-2 text-sm text-slate-600">
          Photos and bios on the home page and massage page. Upload JPEG, PNG, or WebP (up to 5 MB).
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
          <p className="mt-2 text-xs text-slate-500">Loading teamâ€¦</p>
        ) : siteUsesCustomList ? (
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
            Your team list is live ({members.length}{" "}
            {members.length === 1 ? "person" : "people"}).
          </p>
        ) : (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Using the default team â€” sync from scheduling or import the built-in roster below.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={syncingProviders || loading}
          onClick={() => void syncFromBookableProviders()}
          className="rounded-full border border-[#c0392b] bg-[#c0392b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d524f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncingProviders ? "Syncingâ€¦" : "Copy bookable massage providers into team"}
        </button>
        <button
          type="button"
          disabled={seeding || siteUsesCustomList || loading}
          onClick={() => void seedDefaults()}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {seeding ? "Importingâ€¦" : "Import default team from website"}
        </button>
        <button
          type="button"
          disabled={clearing || !siteUsesCustomList || loading}
          onClick={() => void clearAll()}
          className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {clearing ? "Clearingâ€¦" : "Remove custom list (revert to built-in)"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
        <p className="text-sm font-medium text-slate-800">Add massage therapist</p>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">Name</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">Bio</span>
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
            placeholder="Short bio for the website"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">Role (optional, e.g. LMT/Manager)</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800">Sort order (optional; lower appears first)</span>
          <input
            type="number"
            className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={newSort}
            onChange={(e) => setNewSort(e.target.value)}
            placeholder="Auto if empty"
          />
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
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void createMember()}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Savingâ€¦" : "Add to website"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm">
          <p className="font-medium text-slate-900">Edit team member</p>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">Name</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">Bio</span>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">Role (optional)</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">Sort order</span>
            <input
              type="number"
              className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={editSort}
              onChange={(e) => setEditSort(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-slate-800">New portrait (optional)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full text-sm"
              onChange={(e) => setEditPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveEdit()}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
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
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
          >
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only previews; URLs include Storage */}
                <img src={m.photoUrl} alt="" className="h-full w-full object-cover object-top" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="font-semibold text-slate-900">{m.name}</div>
                <div className="text-xs text-slate-600">
                  sort {m.sortOrder}
                  {m.role ? ` Â· ${m.role}` : ""} Â· id <span className="font-mono">{m.id}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openEdit(m)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:border-slate-400"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={deletingId === m.id}
                onClick={() => void deleteMember(m)}
                className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === m.id ? "Removingâ€¦" : "Delete"}
              </button>
            </div>
          </li>
        ))}
        {!loading && members.length === 0 ? (
          <li className="text-slate-600">No team members yet.</li>
        ) : null}
      </ul>
    </section>
  );
}
