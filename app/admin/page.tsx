"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type Auth } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

type Me = {
  authenticated: boolean;
  uid?: string;
  email?: string | null;
  role?: "admin" | "superadmin" | null;
};

type BookingRow = {
  id: string;
  startIso?: string;
  locationId?: string;
  serviceLine?: string;
  durationMin?: number;
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuth(getFirebaseClientAuth());
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as Me;
      setMe(data);
      if (!data.role) {
        setError("Your account is signed in but not yet granted staff access.");
        return;
      }
      const b = await fetch("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!b.ok) {
        setError("Could not load bookings.");
        return;
      }
      const payload = (await b.json()) as { bookings: BookingRow[] };
      setBookings(payload.bookings);
    });
    return () => unsub();
  }, [auth, router]);

  async function refresh() {
    if (!auth) return;
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const b = await fetch("/api/admin/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await b.json()) as { bookings: BookingRow[] };
    setBookings(payload.bookings);
  }

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this booking and free the time slot?")) return;
    if (!auth) return;
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/admin/bookings/${id}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      alert("Could not cancel.");
      return;
    }
    await refresh();
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
    router.replace("/admin/login");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-600">
            Signed in as {me?.email ?? "…"} {me?.role ? `(${me.role})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {me?.role === "superadmin" ? (
            <Link
              href="/admin/super"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
            >
              Superadmin
            </Link>
          ) : null}
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-amber-800">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">When (UTC ISO)</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <tr key={b.id} className="align-top">
                <td className="px-4 py-3 font-mono text-xs text-slate-800">{b.startIso}</td>
                <td className="px-4 py-3 text-slate-700">{b.locationId}</td>
                <td className="px-4 py-3 text-slate-700">{b.serviceLine}</td>
                <td className="px-4 py-3 text-slate-700">{b.durationMin}</td>
                <td className="px-4 py-3 text-slate-700">
                  <div className="font-medium text-slate-900">{b.name}</div>
                  <div>{b.phone}</div>
                  <div className="text-xs text-slate-600">{b.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{b.status}</td>
                <td className="px-4 py-3 text-right">
                  {b.status === "confirmed" ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700 hover:underline"
                      onClick={() => cancelBooking(b.id)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {bookings.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-600" colSpan={7}>
                  No bookings in the current window.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
