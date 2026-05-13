"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import {
  bookingStatusLabel,
  bookingStatusPillClasses,
  type BookingStatus,
} from "@/lib/booking-status";
import type { BookingEvent, BookingRow } from "./types";

type Props = {
  booking: BookingRow | null;
  onClose: () => void;
  onActionComplete: () => void;
  getIdToken: () => Promise<string | null>;
};

const DECLINE_QUICK_REASONS = [
  "Provider unavailable",
  "Outside our scope",
  "Duplicate request",
];

const CANCEL_QUICK_REASONS = [
  "Provider unavailable",
  "Office closed that day",
  "Patient requested by phone",
  "Equipment issue",
];

export function BookingDrawer({ booking, onClose, onActionComplete, getIdToken }: Props) {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [action, setAction] = useState<"decline" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEvents([]);
    setAction(null);
    setReason("");
    setError(null);
    setEventsError(null);
    if (!booking) return;
    let cancelled = false;
    (async () => {
      setLoadingEvents(true);
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch(`/api/admin/bookings/${booking.id}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setEventsError("Could not load history.");
          return;
        }
        const data = (await res.json()) as { events: BookingEvent[] };
        if (!cancelled) setEvents(data.events);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [booking, getIdToken]);

  if (!booking) return null;

  async function runAction(kind: "accept" | "decline" | "cancel", payloadReason?: string) {
    if (!booking) return;
    setWorking(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }
      const res = await fetch(`/api/admin/bookings/${booking.id}/${kind}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: payloadReason !== undefined ? JSON.stringify({ reason: payloadReason }) : "{}",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Action failed.");
        return;
      }
      setAction(null);
      setReason("");
      onActionComplete();
    } finally {
      setWorking(false);
    }
  }

  const status = booking.status ?? "pending";
  const start = booking.startAtMs
    ? DateTime.fromMillis(booking.startAtMs).setZone(TIME_ZONE)
    : null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="drawer-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="min-w-0 space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Appointment</p>
            <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">
              {booking.name ?? "Unknown patient"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${bookingStatusPillClasses(status)}`}
              >
                {bookingStatusLabel(status)}
              </span>
              <span className="text-slate-500">Ref: {booking.id.slice(0, 8)}…</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <section className="space-y-3 border-b border-slate-200 px-6 py-4 text-sm">
          <DetailRow label="When">
            {start ? (
              <>
                <div>{start.toFormat("cccc, LLL d yyyy")}</div>
                <div className="font-semibold text-slate-900">
                  {start.toFormat("h:mm a")} ({start.toFormat("z")})
                </div>
                <div className="text-xs text-slate-500" title={`UTC: ${booking.startIso}`}>
                  {booking.durationMin} minutes
                </div>
              </>
            ) : (
              <span>Unknown</span>
            )}
          </DetailRow>
          <DetailRow label="Location">{prettyLocation(booking.locationId)}</DetailRow>
          <DetailRow label="Service">
            {booking.serviceLine === "massage"
              ? "Massage therapy"
              : booking.serviceLine === "chiropractic"
                ? "Chiropractic"
                : booking.serviceLine ?? "—"}
          </DetailRow>
          <DetailRow label="Provider">
            {booking.providerDisplayName || (
              <span className="italic text-slate-500">First available</span>
            )}
            {booking.providerMode === "any" && booking.preferredProviderDisplayName ? (
              <div className="text-xs text-slate-500">
                Preferred: {booking.preferredProviderDisplayName}
              </div>
            ) : null}
          </DetailRow>
        </section>

        <section className="space-y-3 border-b border-slate-200 px-6 py-4 text-sm">
          <DetailRow label="Patient">
            <div className="font-semibold text-slate-900">{booking.name ?? "—"}</div>
            {booking.phone ? (
              <a
                href={`tel:${booking.phone.replace(/[^\d+]/g, "")}`}
                className="block text-slate-700 hover:underline"
              >
                {booking.phone}
              </a>
            ) : null}
            {booking.email ? (
              <a href={`mailto:${booking.email}`} className="block break-all text-slate-600 hover:underline">
                {booking.email}
              </a>
            ) : null}
          </DetailRow>
          {booking.notes ? (
            <DetailRow label="Notes">
              <p className="whitespace-pre-line text-slate-700">{booking.notes}</p>
            </DetailRow>
          ) : null}
        </section>

        <section className="space-y-3 border-b border-slate-200 px-6 py-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">History</p>
          {loadingEvents ? (
            <p className="text-slate-500">Loading…</p>
          ) : eventsError ? (
            <p className="text-rose-700">{eventsError}</p>
          ) : events.length === 0 ? (
            <p className="text-slate-500">No history yet.</p>
          ) : (
            <ol className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span
                    className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${eventDotClasses(e.type)}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-medium text-slate-900">{eventLabel(e.type)}</div>
                    <div className="text-xs text-slate-500">
                      {formatEventTime(e.atIso)}
                      {e.byEmail ? ` · ${e.byEmail}` : e.byUid ? ` · uid ${e.byUid.slice(0, 6)}…` : ""}
                    </div>
                    {e.reason ? (
                      <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-slate-700">{e.reason}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="mt-auto space-y-3 px-6 py-4">
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {error}
            </p>
          ) : null}

          {action === null ? (
            <div className="flex flex-wrap gap-2">
              {status === "pending" ? (
                <>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => runAction("accept")}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Accept appointment
                  </button>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => {
                      setAction("decline");
                      setReason("");
                    }}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </>
              ) : null}
              {status === "confirmed" ? (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => {
                    setAction("cancel");
                    setReason("");
                  }}
                  className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Cancel appointment
                </button>
              ) : null}
              {status === "declined" || status === "cancelled" ? (
                <p className="text-sm text-slate-500">
                  This appointment is {status}. The time slot has been released.
                </p>
              ) : null}
            </div>
          ) : (
            <ReasonForm
              kind={action}
              quickReasons={action === "decline" ? DECLINE_QUICK_REASONS : CANCEL_QUICK_REASONS}
              reason={reason}
              setReason={setReason}
              working={working}
              onCancel={() => {
                setAction(null);
                setReason("");
              }}
              onConfirm={() => runAction(action, reason.trim() || undefined)}
            />
          )}
        </footer>
      </aside>
    </>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-sm text-slate-800">{children}</div>
    </div>
  );
}

function ReasonForm(props: {
  kind: "decline" | "cancel";
  quickReasons: string[];
  reason: string;
  setReason: (s: string) => void;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const verb = props.kind === "decline" ? "Decline" : "Cancel";
  const description =
    props.kind === "decline"
      ? "Decline this pending request. The slot will be released and the patient will be emailed."
      : "Cancel this confirmed appointment. The slot will be released and the patient will be emailed.";
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm text-slate-700">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {props.quickReasons.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => props.setReason(r)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              props.reason === r
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-slate-700">
          Reason (optional, included in the patient email)
        </span>
        <textarea
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={props.reason}
          onChange={(e) => props.setReason(e.target.value)}
          placeholder="Add a brief note for the patient or leave blank…"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={props.working}
          onClick={props.onConfirm}
          className={`rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            props.kind === "decline" ? "bg-slate-900 hover:bg-slate-800" : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {props.working ? "Working…" : `${verb} appointment`}
        </button>
        <button
          type="button"
          disabled={props.working}
          onClick={props.onCancel}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400 disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function prettyLocation(id: string | undefined): string {
  if (id === "paris") return "Paris, TX";
  if (id === "sulphur_springs") return "Sulphur Springs, TX";
  return id ?? "—";
}

function eventLabel(type: BookingEvent["type"]): string {
  switch (type) {
    case "created":
      return "Request submitted";
    case "accepted":
      return "Accepted by office";
    case "declined":
      return "Declined by office";
    case "cancelled":
      return "Cancelled by office";
    case "note":
      return "Note added";
  }
}

function eventDotClasses(type: BookingEvent["type"]): string {
  switch (type) {
    case "created":
      return "bg-slate-400";
    case "accepted":
      return "bg-emerald-500";
    case "declined":
      return "bg-slate-500";
    case "cancelled":
      return "bg-rose-500";
    case "note":
      return "bg-sky-500";
  }
}

function formatEventTime(iso: string | null): string {
  if (!iso) return "—";
  const dt = DateTime.fromISO(iso).setZone(TIME_ZONE);
  if (!dt.isValid) return iso;
  return dt.toFormat("LLL d yyyy, h:mm a (z)");
}

// keep `BookingStatus` import used (helps IDE inference if drawer is reused)
export type { BookingStatus };
