/**
 * Chiropractic treatment offerings — single source for marketing cards and verbatim lists.
 */

export const CHIRO_TREATMENT_OFFERINGS = [
  {
    name: "Stretch & Flex Rehab",
    desc: "Coach-led stretching and flexibility work coordinated with your chiropractic care plan.",
  },
  {
    name: "Auto Injury",
    desc: "Documentation and treatment after motor vehicle accidents — whiplash, soft tissue, and spinal care.",
  },
  {
    name: "Personal Injury",
    desc: "Care for slip-and-fall, workplace, and other non-auto injuries with thorough exam and records.",
  },
  {
    name: "Sports Injury",
    desc: "Recovery support for athletes — sprains, strains, overuse, and return-to-play planning.",
  },
  {
    name: "Chiropractic Adjustments",
    desc: "Hands-on spinal and joint manipulation to restore alignment and reduce pain.",
  },
  {
    name: "Electric Muscle Stimulation",
    desc: "Low-level electrical pulses that ease muscle spasms and speed tissue recovery.",
  },
  {
    name: "Interferential Current Therapy",
    desc: "Medium-frequency current that penetrates deep tissue to reduce pain and swelling.",
  },
  {
    name: "Microcurrent Therapy",
    desc: "Sub-sensory electrical stimulation that supports tissue repair and reduces inflammation.",
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
    name: "Common Chiropractic Conditions",
    desc: "Allergies, disc problems, whiplash, sciatica, headaches, and other everyday complaints.",
  },
  {
    name: "Therapeutic Exercise",
    desc: "Guided movement programs to rebuild strength, flexibility, and endurance.",
  },
  {
    name: "Therapeutic Massage",
    desc: "Soft-tissue work including trigger point therapy and lymphatic massage.",
  },
  {
    name: "Therapeutic Ultrasound",
    desc: "Sound-wave therapy that increases blood flow and supports soft-tissue healing.",
  },
  {
    name: "Acupuncture",
    desc: "Fine-needle therapy for muscle and joint complaints — offered by Dr. Sean Welborn.",
  },
  {
    name: "Pediatric Care",
    desc: "Gentle, age-appropriate adjustments for infants through teenagers.",
  },
  {
    name: "Prenatal Chiropractic",
    desc: "Gentle adjustments and positioning support for expecting mothers.",
  },
  {
    name: "Spine Care",
    desc: "Comprehensive spinal wellness — adjustments, decompression, massage, and rehab.",
  },
  {
    name: "Injury Rehab",
    desc: "Personalized recovery after accidents, sports injuries, and daily wear-and-tear.",
  },
  {
    name: "Degenerative Disc Disease",
    desc: "Non-surgical care plans for age-related disc changes, herniation, and stenosis.",
  },
  {
    name: "Postural Rehabilitation",
    desc: "Posture Pro assessment and guided rehab exercises to restore spinal balance.",
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
