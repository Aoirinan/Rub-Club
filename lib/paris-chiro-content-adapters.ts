import { CHIRO } from "@/lib/home-verbatim";
import { SS_INJURIES, SS_SERVICES } from "@/lib/sulphur-springs-content";

type ServiceDraft = {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
};

const PARIS_PHONE = "903-785-5551";

/** Rewrite Sulphur Springs / SS office references for Paris service pages. */
export function parisOfficeAdapt(text: string): string {
  return text
    .replace(/our Sulphur Springs (?:chiropractic )?office/gi, "our Paris office")
    .replace(/Chiropractic Associates of Sulphur Springs/g, "Chiropractic Associates in Paris")
    .replace(/in Sulphur Springs, TX/gi, "in Paris, TX")
    .replace(/Sulphur Springs, TX/g, "Paris, TX")
    .replace(/903-919-5020/g, PARIS_PHONE)
    .replace(/\(903\) 919-5020/g, "(903) 785-5551");
}

function ssService(slug: string): Pick<ServiceDraft, "body" | "metaDescription"> {
  const s = SS_SERVICES.find((x) => x.slug === slug);
  if (!s) return { body: "", metaDescription: "" };
  return {
    metaDescription: parisOfficeAdapt(s.metaDescription),
    body: parisOfficeAdapt(s.body),
  };
}

function ssInjury(slug: string): ServiceDraft {
  const i = SS_INJURIES.find((x) => x.slug === slug)!;
  return {
    slug: i.slug,
    title: i.title,
    metaDescription: parisOfficeAdapt(i.metaDescription),
    body: `${parisOfficeAdapt(i.body)}\n\nCall our Paris office at ${PARIS_PHONE} to schedule.`,
  };
}

/** Eleven Paris service pages missing from the initial migration. */
export function buildParisChiroServiceAdditions(): ServiceDraft[] {
  const common = ssService("common-chiropractic-conditions");
  const exercise = ssService("therapeutic-exercise");

  return [
    {
      slug: "stretch-and-flex-rehab",
      title: "Stretch & Flex Rehab",
      metaDescription:
        "Stretch & Flex Rehab at Chiropractic Associates in Paris, TX. Coach-led stretching and flexibility work coordinated with your chiropractic care plan.",
      body: `${CHIRO.stretchP1}\n\n${CHIRO.stretchP2}\n\nOur Stretch & Flex Rehab program pairs guided stretching with your chiropractic treatment so tight muscles and stiff joints recover faster. Ask about it when you call or at your next visit.\n\nCall our Paris office at ${PARIS_PHONE} to learn more or book a session.`,
    },
    ssInjury("auto-injury"),
    ssInjury("personal-injury"),
    ssInjury("sports-injury"),
    {
      slug: "common-chiropractic-conditions",
      title: "Common Chiropractic Conditions",
      metaDescription:
        "Common conditions treated at Chiropractic Associates in Paris, TX — allergies, disc problems, whiplash, sciatica, headaches, and more.",
      body: common.body,
    },
    {
      slug: "therapeutic-exercise",
      title: "Therapeutic Exercise",
      metaDescription:
        "Therapeutic exercise programs at Chiropractic Associates in Paris, TX. Regain flexibility, strength, and endurance for specific physical problems.",
      body: exercise.body,
    },
    {
      slug: "prenatal-chiropractic",
      title: "Prenatal Chiropractic",
      metaDescription:
        "Prenatal chiropractic care at Chiropractic Associates in Paris, TX. Gentle adjustments and positioning support for expecting mothers.",
      body: `Pregnancy changes posture, balance, and how your spine carries weight. Prenatal chiropractic care at our Paris office uses gentle, pregnancy-appropriate techniques to ease back pain, hip pressure, and tension as your body adapts.

## What to Expect

Dr. Brandy Collins and our Paris team adapt every visit to your stage of pregnancy. Adjustments are lighter than standard adult care, and we use positioning that keeps you and your baby comfortable throughout the visit.

## When to Call

Many expecting mothers visit for low back pain, sciatica, round-ligament discomfort, and posture strain. Regular check-ins can also help your pelvis and spine stay balanced as delivery approaches.

Questions about prenatal chiropractic? Call our Paris office at ${PARIS_PHONE}.`,
    },
    {
      slug: "spine-care",
      title: "Spine Care",
      metaDescription:
        "Spine specialists in Paris, TX — Dr. Greg Thompson and Dr. Sean Welborn at Chiropractic Associates. Adjustments, decompression, massage, and rehab.",
      body: `If you're living in pain, suffering from a medical condition, or simply not living your best life, Dr. Greg Thompson and Dr. Sean Welborn of Chiropractic Associates in Paris, TX are here to help.

## What Is a Spine Specialist and When Should You See One?

Your spine is at the center of every move you make. Even a slight misalignment can interfere with the nervous system responsible for how well you sleep, concentrate, and move.

A chiropractor is a spine specialist who keeps your spinal column in the best possible shape — even when you don't realize something is wrong. Regular chiropractic visits help maintain spinal wellness.

### When to See a Spine Specialist

Schedule an appointment if you suffer from neck, back, or shoulder pain; limited range of motion; headaches or migraines; fibromyalgia or arthritis; balance issues; tingling or numbness in the extremities; or digestive issues.

### How We Help

At Chiropractic Associates in Paris, we use spinal adjustments, spinal decompression, soft tissue therapies including therapeutic massage, electrical muscle stimulation, and acupuncture (Dr. Welborn) to build a plan customized to your needs.

Don't leave your spinal health to chance. Call ${PARIS_PHONE} to schedule with our Paris office.`,
    },
    {
      slug: "injury-rehab",
      title: "Injury Rehab",
      metaDescription:
        "Injury rehabilitation at Chiropractic Associates in Paris, TX. Personalized recovery after auto accidents, sports injuries, and daily wear-and-tear.",
      body: `At Chiropractic Associates in Paris, Texas, we know that recovering from an injury can be a challenging journey. Whether you've been hurt in an accident, sports, or gradual wear-and-tear, our team supports your recovery with natural, function-focused care.

## Understanding the Rehabilitation Process

Injury rehabilitation starts with a thorough assessment — physical exam, review of your history, and questions about daily habits — so we address underlying causes, not just symptoms.

## Personalized Treatment Plans

Our Paris treatments may combine chiropractic adjustments, therapeutic exercises, electrical stimulation, ultrasound, and spinal decompression. Each component is chosen to reduce pain, restore function, and help you become more resilient.

Chiropractic adjustments restore proper alignment and motion to the spine and other joints, relieving nerve pressure and supporting natural healing.

## Therapeutic Exercise for Strength and Stability

We guide you through exercises specific to your injury, focusing on strength, flexibility, and proper movement patterns so the affected area stabilizes for the long term.

## Ongoing Support and Education

We explain your condition, options, and self-care strategies so you can take an active role in recovery. We don't push lengthy prepayment plans — our goal is efficient care that gets you back to the activities you love.

Call ${PARIS_PHONE} to schedule injury rehab with Dr. Thompson or Dr. Welborn at our Paris office.`,
    },
  ];
}
