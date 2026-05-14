"use client";

import { useCallback, useEffect, useState } from "react";
import type { Auth } from "firebase/auth";
import type { MassageTeamMemberStored } from "@/lib/massage-team";

type Props = {
  auth: Auth | null;
  onNotify: (message: string | null) => void;
};

export function MassageTeamAdminSection({ auth, onNotify }: Props) {
  const [members, setMembers] = useState<MassageTeamMemberStored[]>([]);
  const [siteUsesCustomList, setSiteUsesCustomList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
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
      if (!res.ok) {
        setMembers([]);
        setSiteUsesCustomList(false);
        return;
      }
      const data = (await res.json()) as {
        members?: MassageTeamMemberStored[];
        siteUsesCustomList?: boolean;
      };
      setMembers(data.members ?? []);
      setSiteUsesCustomList(Boolean(data.siteUsesCustomList));
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  async function seedDefaults() {
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (
      !window.confirm(
        "Copy the built-in team (names, bios, and current portrait links) into Firestore? After this, the public site reads only from Firestore until you clear the list again.",
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onNotify(typeof data.error === "string" ? data.error : "Could not seed team.");
        return;
      }
      onNotify("Team copied into Firestore. Edits on the site now come from this list.");
      await load();
    } finally {
      setSeeding(false);
    }
  }

  async function clearAll() {
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (
      !window.confirm(
        "Delete every massage team row in Firestore and any uploaded portraits in storage? The public pages will go back to the built-in list from code until you seed or add people again.",
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onNotify(typeof data.error === "string" ? data.error : "Could not clear team.");
        return;
      }
      onNotify("Custom team removed. Site is using the built-in list again.");
      setEditing(null);
      await load();
    } finally {
      setClearing(false);
    }
  }

  async function createMember() {
    onNotify(null);
    const user = auth?.currentUser;
    if (!user) return;
    if (!newName.trim() || !newBio.trim()) {
      onNotify("Name and bio are required.");
      return;
    }
    if (!newPhoto) {
      onNotify("Choose a portrait image.");
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onNotify(typeof data.error === "string" ? data.error : "Could not add team member.");
        return;
      }
      onNotify("Team member added.");
      setNewName("");
      setNewBio("");
      setNewRole("");
      setNewSort("");
      setNewPhoto(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    onNotify(null);
    const user = auth?.currentUser;
    if (!user || !editing) return;
    if (!editName.trim() || !editBio.trim()) {
      onNotify("Name and bio are required.");
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
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          onNotify(typeof data.error === "string" ? data.error : "Could not save.");
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
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          onNotify(typeof data.error === "string" ? data.error : "Could not save.");
          return;
        }
      }
      onNotify("Saved.");
      setEditing(null);
      setEditPhoto(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(row: MassageTeamMemberStored) {
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onNotify(typeof data.error === "string" ? data.error : "Could not delete.");
        return;
      }
      onNotify("Removed from site.");
      if (editing?.id === row.id) setEditing(null);
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(row: MassageTeamMemberStored) {
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
        <h2 className="text-lg font-semibold text-slate-900">Website — massage team (Meet the team)</h2>
        <p className="mt-2 text-sm text-slate-600">
          The home page and massage page show this list when Firestore has at least one row. Otherwise they use the
          built-in list from code. Upload portraits here (JPEG, PNG, or WebP, up to 5 MB). For uploaded files, add a
          Firebase Storage rule allowing public read on <code className="rounded bg-slate-100 px-1">public_site/**</code>{" "}
          so visitors can load images.
        </p>
        {loading ? (
          <p className="mt-2 text-xs text-slate-500">Loading team…</p>
        ) : siteUsesCustomList ? (
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
            Public site is using the Firestore list ({members.length}{" "}
            {members.length === 1 ? "person" : "people"}).
          </p>
        ) : (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Public site is still using the built-in team from code. Seed or add someone below to switch editing here.
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
          {seeding ? "Copying…" : "Copy built-in team into Firestore"}
        </button>
        <button
          type="button"
          disabled={clearing || !siteUsesCustomList || loading}
          onClick={() => void clearAll()}
          className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {clearing ? "Clearing…" : "Remove custom list (revert to built-in)"}
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
          {saving ? "Saving…" : "Add to website"}
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
                  {m.role ? ` · ${m.role}` : ""} · id <span className="font-mono">{m.id}</span>
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
                {deletingId === m.id ? "Removing…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
        {!loading && members.length === 0 ? (
          <li className="text-slate-600">No Firestore rows yet.</li>
        ) : null}
      </ul>
    </section>
  );
}
