"use client";

import { useState } from "react";

const PRESSURE_OPTIONS = ["Light", "Medium", "Firm", "Deep"] as const;

const HEAR_OPTIONS = [
  "Google search",
  "Facebook/Instagram",
  "Friend or family referral",
  "Doctor referral",
  "Drive by / signage",
  "Other",
] as const;

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function IntakeForm() {
  const [insuranceCardFrontFile, setInsuranceCardFrontFile] = useState<File | null>(null);
  const [insuranceCardBackFile, setInsuranceCardBackFile] = useState<File | null>(null);
  const [driversLicenseFile, setDriversLicenseFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "TX",
    zip: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    reasonForVisit: "",
    areasOfConcern: "",
    allergies: "",
    medications: "",
    medicalConditions: "",
    pregnant: false,
    pacemaker: false,
    previousMassage: "",
    pressurePreference: "",
    howDidYouHear: "",
    additionalNotes: "",
    service: "massage",
    location: "paris",
    website: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("website", form.website);
      const textKeys = [
        "firstName",
        "lastName",
        "dateOfBirth",
        "phone",
        "email",
        "address",
        "city",
        "state",
        "zip",
        "emergencyContactName",
        "emergencyContactPhone",
        "reasonForVisit",
        "areasOfConcern",
        "allergies",
        "medications",
        "medicalConditions",
        "previousMassage",
        "pressurePreference",
        "howDidYouHear",
        "additionalNotes",
        "service",
        "location",
      ] as const;
      for (const key of textKeys) {
        fd.append(key, String(form[key]));
      }
      fd.append("pregnant", form.pregnant ? "true" : "false");
      fd.append("pacemaker", form.pacemaker ? "true" : "false");
      if (insuranceCardFrontFile) fd.append("insuranceCardFront", insuranceCardFrontFile);
      if (insuranceCardBackFile) fd.append("insuranceCardBack", insuranceCardBackFile);
      if (driversLicenseFile) fd.append("driversLicense", driversLicenseFile);

      const res = await fetch("/api/intake", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Submission failed. Please try again.");
        return;
      }
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="border-t-4 border-[#0f5f5c] bg-white p-8 text-center shadow-md sm:p-12">
        <h2 className="text-2xl font-black text-[#173f3b]">Form submitted</h2>
        <p className="mt-3 text-stone-700">
          Thank you! Your intake form has been received. You&rsquo;re all set for your appointment.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8"
    >
      <div>
        <h2 className="text-xl font-black text-[#173f3b]">New client intake form</h2>
        <p className="mt-1 text-sm text-stone-600">
          Fill this out before your first visit to save time. All fields marked * are required.
        </p>
      </div>

      <div className="hidden" aria-hidden="true">
        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      {/* Service & Location */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">
          Appointment details
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Service *</span>
            <select
              className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
              value={form.service}
              onChange={(e) => update("service", e.target.value)}
              required
            >
              <option value="massage">Massage therapy</option>
              <option value="chiropractic">Chiropractic</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Location *</span>
            <select
              className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              required
            >
              <option value="paris">Paris, TX</option>
              <option value="sulphur_springs">Sulphur Springs, TX</option>
            </select>
          </label>
        </div>
      </fieldset>

      {/* Personal info */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">
          Personal information
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">First name *</span>
            <input
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Last name *</span>
            <input
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Date of birth</span>
            <input
              type="date"
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Phone *</span>
            <input
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.phone}
              onChange={(e) => update("phone", formatPhone(e.target.value))}
              inputMode="tel"
              placeholder="903-555-1234"
              required
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-bold text-[#173f3b]">Email</span>
            <input
              type="email"
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      {/* Address */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">
          Address
        </legend>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Street address</span>
          <input
            className="focus-ring w-full border border-stone-300 px-3 py-2"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">City</span>
            <input
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">State</span>
            <input
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">ZIP</span>
            <input
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.zip}
              onChange={(e) => update("zip", e.target.value)}
              inputMode="numeric"
              maxLength={10}
            />
          </label>
        </div>
      </fieldset>

      {/* ID & insurance (optional uploads) */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">
          Insurance card and ID (optional)
        </legend>
        <p className="text-sm text-stone-600">
          Upload the front and back of your insurance card plus your driver&apos;s license or
          government-issued ID to speed up intake. All uploads are optional. Accepted formats: JPG,
          PNG, WebP, or PDF (max 10 MB each).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Insurance card — front</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="focus-ring w-full border border-stone-300 bg-white px-2 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#0f5f5c] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
              onChange={(e) => setInsuranceCardFrontFile(e.target.files?.[0] ?? null)}
            />
            {insuranceCardFrontFile ? (
              <span className="text-xs text-stone-500">{insuranceCardFrontFile.name}</span>
            ) : null}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Insurance card — back</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="focus-ring w-full border border-stone-300 bg-white px-2 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#0f5f5c] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
              onChange={(e) => setInsuranceCardBackFile(e.target.files?.[0] ?? null)}
            />
            {insuranceCardBackFile ? (
              <span className="text-xs text-stone-500">{insuranceCardBackFile.name}</span>
            ) : null}
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-bold text-[#173f3b]">Driver&apos;s license or ID</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="focus-ring w-full border border-stone-300 bg-white px-2 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#0f5f5c] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
              onChange={(e) => setDriversLicenseFile(e.target.files?.[0] ?? null)}
            />
            {driversLicenseFile ? (
              <span className="text-xs text-stone-500">{driversLicenseFile.name}</span>
            ) : null}
          </label>
        </div>
      </fieldset>

      {/* Emergency contact */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">
          Emergency contact
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Name</span>
            <input
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.emergencyContactName}
              onChange={(e) => update("emergencyContactName", e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-bold text-[#173f3b]">Phone</span>
            <input
              className="focus-ring w-full border border-stone-300 px-3 py-2"
              value={form.emergencyContactPhone}
              onChange={(e) => update("emergencyContactPhone", formatPhone(e.target.value))}
              inputMode="tel"
            />
          </label>
        </div>
      </fieldset>

      {/* Health info */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">
          Health information
        </legend>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Reason for visit *</span>
          <textarea
            className="focus-ring min-h-[80px] w-full border border-stone-300 px-3 py-2"
            value={form.reasonForVisit}
            onChange={(e) => update("reasonForVisit", e.target.value)}
            placeholder="Why are you coming in today?"
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Areas of concern or pain</span>
          <input
            className="focus-ring w-full border border-stone-300 px-3 py-2"
            value={form.areasOfConcern}
            onChange={(e) => update("areasOfConcern", e.target.value)}
            placeholder="e.g. lower back, neck, shoulders"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Known allergies</span>
          <input
            className="focus-ring w-full border border-stone-300 px-3 py-2"
            value={form.allergies}
            onChange={(e) => update("allergies", e.target.value)}
            placeholder="e.g. latex, specific oils"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Current medications</span>
          <input
            className="focus-ring w-full border border-stone-300 px-3 py-2"
            value={form.medications}
            onChange={(e) => update("medications", e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Medical conditions</span>
          <input
            className="focus-ring w-full border border-stone-300 px-3 py-2"
            value={form.medicalConditions}
            onChange={(e) => update("medicalConditions", e.target.value)}
            placeholder="e.g. diabetes, high blood pressure, recent surgery"
          />
        </label>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-[#173f3b]">
            <input
              type="checkbox"
              checked={form.pregnant}
              onChange={(e) => update("pregnant", e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            <span className="font-bold">Currently pregnant</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-[#173f3b]">
            <input
              type="checkbox"
              checked={form.pacemaker}
              onChange={(e) => update("pacemaker", e.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            <span className="font-bold">Pacemaker or implanted device</span>
          </label>
        </div>
      </fieldset>

      {/* Massage preferences */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">
          Massage preferences
        </legend>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Have you had a professional massage before?</span>
          <select
            className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
            value={form.previousMassage}
            onChange={(e) => update("previousMassage", e.target.value)}
          >
            <option value="">— Select —</option>
            <option value="yes">Yes</option>
            <option value="no">No, this will be my first</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Pressure preference</span>
          <div className="flex flex-wrap gap-2 pt-1">
            {PRESSURE_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => update("pressurePreference", p)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  form.pressurePreference === p
                    ? "border-[#0f5f5c] bg-[#0f5f5c] text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:border-[#0f5f5c]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </label>
      </fieldset>

      {/* How heard + notes */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-black uppercase tracking-wide text-[#0f5f5c]">
          Additional
        </legend>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">How did you hear about us?</span>
          <select
            className="focus-ring w-full border border-stone-300 bg-white px-3 py-2"
            value={form.howDidYouHear}
            onChange={(e) => update("howDidYouHear", e.target.value)}
          >
            <option value="">— Select —</option>
            {HEAR_OPTIONS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-bold text-[#173f3b]">Additional notes</span>
          <textarea
            className="focus-ring min-h-[64px] w-full border border-stone-300 px-3 py-2"
            value={form.additionalNotes}
            onChange={(e) => update("additionalNotes", e.target.value)}
            placeholder="Anything else we should know?"
          />
        </label>
      </fieldset>

      <p className="text-xs text-stone-500">
        Information you submit is used for appointment preparation and care coordination. Optional
        uploads are stored securely and are only available to authorized clinic staff; access is
        logged for privacy compliance.
      </p>

      {error ? (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d] disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit intake form"}
      </button>
    </form>
  );
}
