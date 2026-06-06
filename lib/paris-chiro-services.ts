/**
 * Paris chiropractic service detail pages.
 * Clinical copy adapted for the Paris office (Chiropractic Associates, Paris, TX).
 * Rendered at /services/chiropractic/[slug].
 */

export type ParisChiroService = {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
};

export const PARIS_CHIRO_SERVICES: readonly ParisChiroService[] = [
  {
    slug: "therapeutic-ultrasound",
    title: "Therapeutic Ultrasound",
    metaDescription:
      "Therapeutic ultrasound at Chiropractic Associates in Paris, TX. Non-invasive therapy for soft tissue injuries, joint pain, and muscle spasms.",
    body: `Therapeutic ultrasound is used for injuries related to most soft tissues, joints, and muscle spasms. While it shares the same name, this ultrasound is not the same as the kind used diagnostically to screen the body internally.

## What is Therapeutic Ultrasound?

Ultrasound emits small sound waves at a very high frequency that is out of the range of human hearing. When applied to problem areas in soft tissues and joints, it produces heat that helps reduce inflammation and increase blood flow, while decreasing pain, stiffness, and spasms. Therapeutic ultrasound is also believed to have a positive effect on the healing process.

## How Does Therapeutic Ultrasound Work?

While its goals are different from ultrasound screening technologies, ultrasound therapy is performed in much the same way. An ultrasound-emitting wand is passed over your skin across the pain point or injury. We apply ultrasound gel to reduce friction and improve transmission of the sound waves. Despite the deep-tissue heat applied during therapy, you typically feel little or no heat at all.

Therapeutic ultrasound has been shown to support the body's healing process at the cellular level. Call our Paris office at 903-785-5551 to discuss whether therapeutic ultrasound may be beneficial on your road to recovery.`,
  },
  {
    slug: "degenerative-disc-disease",
    title: "Degenerative Disc Disease",
    metaDescription:
      "Degenerative disc disease care at Chiropractic Associates in Paris, TX. Symptoms, causes, and non-surgical treatment options.",
    body: `## What is Degenerative Disc Disease?

Degenerative disc disease is not so much a disease as it is a name for the changes that can happen to the spine as we age.

Your discs are made of a tough, rubbery exterior and a soft interior, and they sit between the vertebrae to act as shock absorbers. As we age, the spinal discs begin to degenerate. This can lead to herniated discs, bulging discs, spinal stenosis, and osteoarthritis.

## Symptoms

Disc degeneration may cause no symptoms at all, and symptoms vary from patient to patient. Pain may occur at the site of the affected disc in the back or neck. Because the pain is often caused by compressed nerves, it can also travel to the buttocks, arms, and legs. Numbness and tingling may also be felt. Pain can range from mild to severe and debilitating.

## Causes

Our spines can degenerate as a natural part of aging. Tears in the tougher outer layer of the disc are common as we grow older, and as the discs lose fluid they become smaller and less flexible. Other contributing factors include obesity, smoking, repeated physical work, and injury.

## Treatment

Pain caused by degeneration is often managed with hot or cold packs and anti-inflammatory measures. When degeneration leads to herniated or bulging discs, spinal stenosis, or osteoarthritis, other approaches may help — including spinal decompression, chiropractic adjustments, therapeutic exercise, and stretching. If you are experiencing frequent back or neck pain, visit our Paris office for an examination so we can build a treatment plan for you. Call 903-785-5551 to schedule.`,
  },
  {
    slug: "postural-rehabilitation",
    title: "Postural Rehabilitation",
    metaDescription:
      "Postural rehabilitation and Posture Pro analysis at Chiropractic Associates in Paris, TX. Digital posture assessment and one-on-one rehab exercises.",
    body: `Spinal rehabilitation is offered at Chiropractic Associates in Paris. This service, called Posture Pro, assesses your posture using digital images to determine whether areas of your spine are weak or out of balance.

Once we identify which muscles need attention, we'll guide you through one-on-one rehabilitative exercises. Low-tech rehab equipment, such as body balls, is used so you can learn exercises that are easy to continue at home once you demonstrate them confidently in the office.

To schedule an appointment for postural rehabilitation, call Chiropractic Associates in Paris at 903-785-5551.`,
  },
] as const;

export const PARIS_CHIRO_SERVICE_NAV = PARIS_CHIRO_SERVICES.map((s) => ({
  href: `/services/chiropractic/${s.slug}`,
  label: s.title,
}));

export function allParisChiroServiceSlugs(): string[] {
  return PARIS_CHIRO_SERVICES.map((s) => s.slug);
}

export function getParisChiroService(slug: string): ParisChiroService | null {
  return PARIS_CHIRO_SERVICES.find((s) => s.slug === slug) ?? null;
}
