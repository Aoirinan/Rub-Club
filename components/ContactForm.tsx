"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("General inquiry");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit() {
    setStatus(null);
    if (!name.trim() || !email.trim() || message.trim().length < 5) {
      setStatus({ kind: "err", text: "Please fill in name, email, and a short message." });
      return;
    }
    setSubmitting(true);
    track("contact_submitted", { topic });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, topic, message, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus({ kind: "err", text: data.error || "Could not send your message. Please call us." });
        track("contact_failed", {});
        return;
      }
      setStatus({
        kind: "ok",
        text: "Thanks — your message is on its way. We'll respond during office hours.",
      });
      track("contact_succeeded", { topic });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="font-bold text-[#173f3b]">Topic</span>
          <select
            className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option>General inquiry</option>
            <option>Chiropractic question</option>
            <option>Massage question</option>
            <option>Insurance &amp; billing</option>
            <option>Reschedule existing appointment</option>
            <option>Other</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Full name</span>
          <input
            className="focus-ring w-full border border-stone-300 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Email</span>
          <input
            type="email"
            className="focus-ring w-full border border-stone-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="font-bold text-[#173f3b]">Phone (optional)</span>
          <input
            className="focus-ring w-full border border-stone-300 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="font-bold text-[#173f3b]">Message</span>
          <textarea
            className="focus-ring min-h-[140px] w-full border border-stone-300 px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
      </div>

      <p className="text-xs text-stone-600">
        Please do not include sensitive medical details in this form. For appointments or care
        questions, please call us. We respond during office hours.
      </p>

      <button
        type="submit"
        className="focus-ring bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b] disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? "Sending…" : "Send message"}
      </button>

      {status ? (
        <p
          role="status"
          className={`rounded border px-3 py-2 text-sm ${
            status.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {status.text}
        </p>
      ) : null}
    </form>
  );
}
