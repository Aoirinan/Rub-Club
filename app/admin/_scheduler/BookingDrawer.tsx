"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  /** Massage therapists and other read-only roles: view details only. */
  readOnly?: boolean;
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

type DrawerAction =
  | "decline"
  | "cancel"
  | "remind"
  | "charge"
  | "email"
  | null;

export function BookingDrawer({ booking, onClose, onActionComplete, getIdToken, readOnly = false }: Props) {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [action, setAction] = useState<DrawerAction>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDescription, setChargeDescription] = useState("");

  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const [notesDraft, setNotesDraft] = useState("");
  const [visitBusy, setVisitBusy] = useState(false);

  useEffect(() => {
    setNotesDraft(booking?.internalNotes ?? "");
  }, [booking?.id, booking?.internalNotes]);

  useEffect(() => {
    setEvents([]);
    setAction(null);
    setReason("");
    setError(null);
    setSuccessMsg(null);
    setEventsError(null);
    setChargeAmount("");
    setChargeDescription("");
    setEmailSubject("");
    setEmailMessage("");
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

  async function pushDeskFlags(patch: { checkedIn?: boolean; needsReschedule?: boolean }) {
    const b = booking;
    if (!b) return;
    setVisitBusy(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(b.id)}/visit-state`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update visit flags.");
        return;
      }
      onActionComplete();
    } finally {
      setVisitBusy(false);
    }
  }

  async function saveVisitNotes() {
    const b = booking;
    if (!b) return;
    setVisitBusy(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(b.id)}/visit-state`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ internalNotes: notesDraft }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save notes.");
        return;
      }
      setSuccessMsg("Notes saved.");
      onActionComplete();
    } finally {
      setVisitBusy(false);
    }
  }

  if (!booking) return null;

  async function runAction(kind: "accept" | "decline" | "cancel", payloadReason?: string) {
    if (!booking) return;
    setWorking(true);
    setError(null);
    setSuccessMsg(null);
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

  async function runReminder() {
    if (!booking) return;
    setWorking(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }
      const res = await fetch(`/api/admin/bookings/${booking.id}/remind`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        emailSent?: boolean;
        smsSent?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to send reminder.");
        return;
      }
      const parts: string[] = [];
      if (data.emailSent) parts.push("email");
      if (data.smsSent) parts.push("SMS");
      setSuccessMsg(
        parts.length > 0
          ? `Reminder sent via ${parts.join(" and ")}.`
          : "Reminder requested (check SendGrid/Twilio config).",
      );
      setAction(null);
      onActionComplete();
    } finally {
      setWorking(false);
    }
  }

  async function runCharge() {
    if (!booking) return;
    const cents = Math.round(parseFloat(chargeAmount) * 100);
    if (!cents || cents < 50) {
      setError("Enter a valid amount ($0.50 or more).");
      return;
    }
    setWorking(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }
      const res = await fetch(`/api/admin/bookings/${booking.id}/charge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          amountCents: cents,
          description: chargeDescription.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        paymentUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to create payment link.");
        return;
      }
      setSuccessMsg("Payment link sent to patient.");
      setAction(null);
      setChargeAmount("");
      setChargeDescription("");
      onActionComplete();
    } finally {
      setWorking(false);
    }
  }

  async function runCustomEmail() {
    if (!booking) return;
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setError("Both subject and message are required.");
      return;
    }
    setWorking(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setError("Not signed in.");
        return;
      }
      const res = await fetch(`/api/admin/bookings/${booking.id}/email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to send email.");
        return;
      }
      setSuccessMsg("Email sent to patient.");
      setAction(null);
      setEmailSubject("");
      setEmailMessage("");
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
          <DetailRow label="Payment">
            {typeof booking.paidAmountCents === "number" && booking.paidAmountCents > 0 ? (
              <>
                <p className="font-medium text-emerald-800">
                  Paid ${(booking.paidAmountCents / 100).toFixed(2)}
                  {typeof booking.paidAtMs === "number" ? (
                    <span className="font-normal text-slate-700">
                      {" "}
                      ·{" "}
                      {DateTime.fromMillis(booking.paidAtMs)
                        .setZone(TIME_ZONE)
                        .toFormat("LLL d yyyy · h:mm a")}
                    </span>
                  ) : null}
                </p>
                {booking.squarePaymentId ? (
                  <p className="text-xs text-slate-500" title={booking.squarePaymentId}>
                    Square ID: {booking.squarePaymentId.length > 14
                      ? `${booking.squarePaymentId.slice(0, 14)}…`
                      : booking.squarePaymentId}
                  </p>
                ) : null}
              </>
            ) : booking.paymentLinkUrl ? (
              <>
                <p className="text-slate-800">Checkout link active</p>
                {typeof booking.paymentAmountCents === "number" ? (
                  <p className="text-xs text-slate-600">
                    Amount: ${(booking.paymentAmountCents / 100).toFixed(2)}
                  </p>
                ) : null}
                <a
                  href={booking.paymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-sky-800 underline"
                >
                  Open Square checkout
                </a>
              </>
            ) : booking.prepaidOnline ? (
              <p className="text-sm text-amber-900">
                Prepay expected for this booking; payment link is created when checkout is generated.
              </p>
            ) : (
              <span className="text-slate-500">No online prepayment on file.</span>
            )}
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
            {booking.phone && booking.phone.replace(/\D/g, "").length >= 7 ? (
              <Link
                href={`/admin/patient?phone=${encodeURIComponent(booking.phone)}`}
                className="mt-1 inline-block text-xs font-semibold text-sky-800 underline"
              >
                Patient record
              </Link>
            ) : null}
            {booking.email ? (
              <a href={`mailto:${booking.email}`} className="block break-all text-slate-600 hover:underline">
                {booking.email}
              </a>
            ) : null}
          </DetailRow>
        </section>

        {status === "pending" || status === "confirmed" ? (
          <section className="space-y-4 border-b border-slate-200 px-6 py-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visit / front desk
            </p>
            {booking.notes ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-600">Patient booking message</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{booking.notes}</p>
              </div>
            ) : null}
            {booking.confirmationStatus === "confirmed_online" ? (
              <p className="text-xs font-medium text-emerald-800">Confirmed online (SMS link used).</p>
            ) : (
              <p className="text-xs text-slate-600">
                Patient has not confirmed online yet (gray circle on calendar).
              </p>
            )}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={Boolean(booking.checkedInAtMs)}
                disabled={visitBusy || working}
                onChange={(e) => void pushDeskFlags({ checkedIn: e.target.checked })}
              />
              <span>Checked in at office (★)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={Boolean(booking.needsReschedule)}
                disabled={visitBusy || working}
                onChange={(e) => void pushDeskFlags({ needsReschedule: e.target.checked })}
              />
              <span>Needs reschedule (✕)</span>
            </label>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600" htmlFor="visit-notes">
                Internal visit notes (staff only, max 2000 characters)
              </label>
              <textarea
                id="visit-notes"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={4}
                maxLength={2000}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                disabled={visitBusy || working}
              />
              <button
                type="button"
                disabled={visitBusy || working || notesDraft === (booking.internalNotes ?? "")}
                onClick={() => void saveVisitNotes()}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
              >
                {visitBusy ? "Saving…" : "Save notes"}
              </button>
            </div>
          </section>
        ) : booking.notes || booking.internalNotes ? (
          <section className="space-y-3 border-b border-slate-200 px-6 py-4 text-sm">
            {booking.notes ? (
              <DetailRow label="Patient booking message">
                <p className="whitespace-pre-line text-slate-700">{booking.notes}</p>
              </DetailRow>
            ) : null}
            {booking.internalNotes ? (
              <DetailRow label="Internal visit notes">
                <p className="whitespace-pre-line text-slate-700">{booking.internalNotes}</p>
              </DetailRow>
            ) : null}
          </section>
        ) : null}

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
                    {e.meta ? <EventMeta meta={e.meta} type={e.type} /> : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {!readOnly && status === "confirmed" && action === null ? (
          <section className="space-y-3 border-b border-slate-200 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={working}
                onClick={() => {
                  setAction("remind");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
              >
                Send reminder
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => {
                  setAction("charge");
                  setError(null);
                  setSuccessMsg(null);
                  setChargeAmount("");
                  setChargeDescription("");
                }}
                className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                Charge
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => {
                  setAction("email");
                  setError(null);
                  setSuccessMsg(null);
                  setEmailSubject("");
                  setEmailMessage("");
                }}
                className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
              >
                Send email
              </button>
            </div>
          </section>
        ) : null}

        {!readOnly ? (
        <footer className="mt-auto space-y-3 px-6 py-4">
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {error}
            </p>
          ) : null}
          {successMsg ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {successMsg}
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
          ) : action === "decline" || action === "cancel" ? (
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
          ) : action === "remind" ? (
            <ReminderConfirm
              booking={booking}
              working={working}
              onCancel={() => setAction(null)}
              onConfirm={runReminder}
            />
          ) : action === "charge" ? (
            <ChargeForm
              amount={chargeAmount}
              setAmount={setChargeAmount}
              description={chargeDescription}
              setDescription={setChargeDescription}
              working={working}
              onCancel={() => {
                setAction(null);
                setChargeAmount("");
                setChargeDescription("");
              }}
              onConfirm={runCharge}
            />
          ) : action === "email" ? (
            <CustomEmailForm
              subject={emailSubject}
              setSubject={setEmailSubject}
              message={emailMessage}
              setMessage={setEmailMessage}
              working={working}
              onCancel={() => {
                setAction(null);
                setEmailSubject("");
                setEmailMessage("");
              }}
              onConfirm={runCustomEmail}
            />
          ) : null}
        </footer>
        ) : null}
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

function EventMeta({ meta, type }: { meta: Record<string, unknown>; type: BookingEvent["type"] }) {
  if (type === "payment_requested" && meta.amountCents) {
    const dollars = (Number(meta.amountCents) / 100).toFixed(2);
    return (
      <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
        Payment link sent — ${dollars}
      </p>
    );
  }
  if (type === "payment_completed" && meta.amountCents) {
    const dollars = (Number(meta.amountCents) / 100).toFixed(2);
    return (
      <p className="mt-1 rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
        Paid — ${dollars}
      </p>
    );
  }
  if (type === "reminder_sent") {
    const channels: string[] = [];
    if (meta.emailSent) channels.push("email");
    if (meta.smsSent) channels.push("SMS");
    return channels.length > 0 ? (
      <p className="mt-1 rounded bg-sky-50 px-2 py-1 text-xs text-sky-800">
        Sent via {channels.join(" and ")}
      </p>
    ) : null;
  }
  if (type === "custom_email" && meta.subject) {
    return (
      <p className="mt-1 rounded bg-violet-50 px-2 py-1 text-xs text-violet-800">
        Subject: {String(meta.subject)}
      </p>
    );
  }
  if (type === "rescheduled" && meta.newStartIso) {
    return (
      <p className="mt-1 rounded bg-cyan-50 px-2 py-1 text-xs text-cyan-900">
        New start: {String(meta.newStartIso)}
      </p>
    );
  }
  if (type === "survey_sent") {
    return (
      <p className="mt-1 rounded bg-teal-50 px-2 py-1 text-xs text-teal-900">
        Automated review request
      </p>
    );
  }
  return null;
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

function ReminderConfirm(props: {
  booking: BookingRow;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
      <p className="text-sm text-sky-900">
        Send a reminder email and SMS to <strong>{props.booking.name ?? "the patient"}</strong> about
        this appointment?
      </p>
      {props.booking.email ? (
        <p className="text-xs text-sky-700">Email: {props.booking.email}</p>
      ) : null}
      {props.booking.phone ? (
        <p className="text-xs text-sky-700">SMS: {props.booking.phone}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={props.working}
          onClick={props.onConfirm}
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {props.working ? "Sending…" : "Send reminder"}
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

function ChargeForm(props: {
  amount: string;
  setAmount: (s: string) => void;
  description: string;
  setDescription: (s: string) => void;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm text-amber-900">
        Create a Square payment link and send it to the patient via email and SMS.
      </p>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-amber-800">Amount (USD)</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-amber-800">$</span>
          <input
            type="number"
            step="0.01"
            min="0.50"
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
            value={props.amount}
            onChange={(e) => props.setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-amber-800">Description (optional)</span>
        <input
          type="text"
          maxLength={200}
          className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
          value={props.description}
          onChange={(e) => props.setDescription(e.target.value)}
          placeholder="e.g. 60-minute massage"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={props.working || !props.amount}
          onClick={props.onConfirm}
          className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {props.working ? "Creating…" : "Send payment link"}
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

function CustomEmailForm(props: {
  subject: string;
  setSubject: (s: string) => void;
  message: string;
  setMessage: (s: string) => void;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
      <p className="text-sm text-violet-900">
        Send a custom email to the patient. The message will be wrapped in the office branded template.
      </p>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-violet-800">Subject</span>
        <input
          type="text"
          maxLength={200}
          className="w-full rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm"
          value={props.subject}
          onChange={(e) => props.setSubject(e.target.value)}
          placeholder="e.g. A note about your appointment"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-violet-800">Message</span>
        <textarea
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm"
          value={props.message}
          onChange={(e) => props.setMessage(e.target.value)}
          placeholder="Type your message to the patient…"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={props.working || !props.subject.trim() || !props.message.trim()}
          onClick={props.onConfirm}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {props.working ? "Sending…" : "Send email"}
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
    case "reminder_sent":
      return "Reminder sent";
    case "payment_requested":
      return "Payment requested";
    case "payment_completed":
      return "Payment received";
    case "custom_email":
      return "Email sent to patient";
    case "rescheduled":
      return "Rescheduled";
    case "survey_sent":
      return "Post-visit survey sent";
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
    case "reminder_sent":
      return "bg-sky-400";
    case "payment_requested":
      return "bg-amber-500";
    case "payment_completed":
      return "bg-emerald-600";
    case "custom_email":
      return "bg-violet-500";
    case "rescheduled":
      return "bg-cyan-500";
    case "survey_sent":
      return "bg-teal-400";
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
