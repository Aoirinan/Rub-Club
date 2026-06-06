/**
 * Chiropractic treatment offerings — single source for marketing cards and verbatim lists.
 */

export const CHIRO_TREATMENT_OFFERINGS = [
  {
    name: "Chiropractic Adjustments",
    desc: "Hands-on spinal and joint manipulation to restore alignment and reduce pain.",
  },
  {
    name: "Electric Muscle Stimulation",
    desc: "Low-level electrical pulses that ease muscle spasms and speed tissue recovery.",
  },
  {
    name: "Heat & Cryotherapy",
    desc: "Targeted heat and cold application to reduce inflammation and improve circulation.",
  },
  {
    name: "Spinal Decompression",
    desc: "Gentle traction therapy to relieve pressure on compressed discs and nerves.",
  },
  {
    name: "Therapeutic Massage",
    desc: "Soft-tissue work including trigger point therapy and lymphatic massage.",
  },
  {
    name: "Acupuncture",
    desc: "Fine-needle therapy for muscle and joint complaints — offered by Dr. Sean Welborn.",
  },
  {
    name: "Pediatric Care",
    desc: "Gentle, age-appropriate adjustments for infants through teenagers.",
  },
] as const;

/** Plain list used in home-verbatim / legacy copy. */
export const CHIRO_TREATMENT_NAMES: readonly string[] = CHIRO_TREATMENT_OFFERINGS.map(
  (t) => t.name,
);

export type ChiroTreatment = { name: string; desc: string };

/**
 * Default value for the editable treatments list CMS field.
 * One card per line as "Name — Description"; reorder/add/remove by editing lines.
 */
export const CHIRO_TREATMENTS_LIST_DEFAULT: string = CHIRO_TREATMENT_OFFERINGS.map(
  (t) => `${t.name} — ${t.desc}`,
).join("\n");

/** Parse the editable treatments list (one "Name — Description" per line) into cards. */
export function parseChiroTreatments(value: string): ChiroTreatment[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const name = (line.split(/\s+[—–-]\s+/)[0] ?? "").trim();
      const desc = line
        .slice(name.length)
        .replace(/^\s*[—–-]\s*/, "")
        .trim();
      return { name, desc };
    })
    .filter((t) => t.name.length > 0);
}
