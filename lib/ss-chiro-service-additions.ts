/**
 * Sulphur Springs service pages that mirror the Paris catalog.
 *
 * The Sulphur Springs office performs the same services as Paris, so this copy
 * is adapted from `lib/paris-chiro-services.ts` with the Sulphur Springs office
 * name and phone number. Doctor names are deliberately left generic ("our
 * chiropractors") because the Paris pages name the Paris doctors, who do not all
 * practice in Sulphur Springs.
 *
 * Kept in its own module rather than inlined in `lib/sulphur-springs-content.ts`
 * so the Paris adapters can keep importing `SS_SERVICES` without a cycle.
 */

type SSServiceAddition = {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
  unlisted?: boolean;
};

const SS_PHONE = "903-919-5020";

export function buildSSServiceAdditions(): SSServiceAddition[] {
  return [
    {
      slug: "stretch-and-flex-rehab",
      title: "Stretch & Flex Rehab",
      metaDescription:
        "Stretch & Flex Rehab at Chiropractic Associates of Sulphur Springs, TX. Attended stretching, aerobic exercise, CORE strengthening, and resistance exercise coordinated with chiropractic care.",
      body: `## WHY STRETCH?

Our rehab coaches use attended stretching techniques that will help your muscles become flexible and have more range of motion. When your body is suffering from stiffness, joint or muscle pain, we forget about the importance of stretching. We believe that our stretching rehab techniques and chiropractor adjustments will help the muscles and also keep the body relaxed. Maintaining a wellness visit will not only reduce the chances but may also prevent injuries and allows your body to react in a positive way during daily activities. Here at our Sulphur Springs office, we will offer attended stretching, aerobic exercise, CORE strengthening, resistance exercise and instructions for at home stretching.

To get started, call our Sulphur Springs office at ${SS_PHONE}.`,
    },
    {
      slug: "interferential-current-therapy",
      title: "Interferential Current Therapy",
      metaDescription:
        "Interferential current therapy at Chiropractic Associates of Sulphur Springs, TX. Deep-penetrating electrical stimulation for pain relief and reduced swelling.",
      body: `Interferential current therapy (IFC) uses medium-frequency electrical currents that cross over each other to penetrate deeper into tissue than standard TENS units. The result is pain relief, reduced swelling, and improved circulation in muscles and joints.

## How It Works

Electrodes are placed around the painful area. The alternating currents stimulate nerves and muscles in a way that blocks pain signals and encourages the body to release endorphins. Many patients find IFC comfortable — you may feel a gentle tingling sensation during treatment.

IFC is often used alongside chiropractic adjustments for back pain, sciatica, muscle spasms, and post-injury recovery. Call our Sulphur Springs office at ${SS_PHONE} to ask whether interferential current therapy fits your treatment plan.`,
    },
    {
      slug: "microcurrent-therapy",
      title: "Microcurrent Therapy",
      metaDescription:
        "Microcurrent therapy at Chiropractic Associates of Sulphur Springs, TX. Low-level electrical stimulation to support tissue repair and reduce inflammation.",
      body: `Microcurrent therapy delivers extremely low-level electrical currents — so low you typically cannot feel them — that mirror the body's natural electrical activity. The goal is to support cellular repair, reduce inflammation, and accelerate healing in soft tissue.

## When We Use Microcurrent

Microcurrent may be recommended for acute sprains, chronic tendon irritation, post-surgical recovery support, and areas where deeper electrical stimulation would be too intense. Sessions are brief and are often combined with adjustments, massage, or other therapies in your care plan.

Interested in learning more? Call Chiropractic Associates of Sulphur Springs at ${SS_PHONE}.`,
    },
    {
      slug: "acupuncture",
      title: "Acupuncture",
      metaDescription:
        "Acupuncture treatment at Chiropractic Associates of Sulphur Springs, TX. Used to alleviate pain and promote overall health.",
      body: `Acupuncture is an ancient Chinese medicine used to alleviate pain and promote overall health.

Acupuncture uses needles placed along invisible meridians that run throughout the body. Today, practitioners also use lasers, magnets and electric pulses in addition to needles. Each meridian point has a specific meaning and can unblock and repair meridians and channels with vital energy or chi. Through the stimulation of the meridians, an acupuncturist is able to restore balance and ergo health to the patient.

Acupuncture is used to treat a wide range of health problems, such as:

- Persistent lower back pain
- Chronic tension-type headaches and migraines
- Neck pain
- Joint pain
- Postoperative pain
- Allergies
- Depression and anxiety
- Insomnia

Acupuncture takes a holistic approach to understanding normal function and disease processes, and focuses as much on the prevention of illness as on the treatment. Call our Sulphur Springs office at ${SS_PHONE} to ask whether acupuncture may be right for you.`,
    },
    {
      slug: "pediatric-care",
      title: "Pediatric Care",
      metaDescription:
        "Pediatric chiropractic care at Chiropractic Associates of Sulphur Springs, TX. Gentle, age-appropriate adjustments for infants through teenagers.",
      body: `Children's spines grow and change quickly, and everyday tumbles, heavy backpacks, and sports can all affect alignment. Pediatric chiropractic care uses gentle, age-appropriate techniques to support healthy development from infancy through the teenage years.

## What to Expect

Adjustments for children are much lighter than those for adults — often no more pressure than you would use to test a ripe tomato. We adapt every technique to your child's age, size, and comfort level, and we take time to make visits feel safe and even fun.

## When Parents Bring Kids In

Common reasons families visit include posture concerns, sports injuries, growing pains, and discomfort after falls. Regular check-ups can also help catch alignment issues early, while the spine is still developing.

Have questions about whether chiropractic care is right for your child? Call our Sulphur Springs office at ${SS_PHONE} — we are happy to talk it through.`,
    },
    {
      slug: "prenatal-chiropractic",
      title: "Prenatal Chiropractic",
      metaDescription:
        "Prenatal chiropractic care at Chiropractic Associates of Sulphur Springs, TX. Gentle adjustments and positioning support for expecting mothers.",
      body: `Pregnancy changes posture, balance, and how your spine carries weight. Prenatal chiropractic care at our Sulphur Springs office uses gentle, pregnancy-appropriate techniques to ease back pain, hip pressure, and tension as your body adapts.

## What to Expect

Our Sulphur Springs team adapts every visit to your stage of pregnancy. Adjustments are lighter than standard adult care, and we use positioning that keeps you and your baby comfortable throughout the visit.

## When to Call

Many expecting mothers visit for low back pain, sciatica, round-ligament discomfort, and posture strain. Regular check-ins can also help your pelvis and spine stay balanced as delivery approaches.

Questions about prenatal chiropractic? Call our Sulphur Springs office at ${SS_PHONE}.`,
    },
    {
      slug: "spine-care",
      title: "Spine Care",
      metaDescription:
        "Spine care at Chiropractic Associates of Sulphur Springs, TX. Adjustments, spinal decompression, massage, and rehabilitation for neck and back pain.",
      body: `If you're living in pain, suffering from a medical condition, or simply not living your best life, our chiropractors at Chiropractic Associates of Sulphur Springs, TX are here to help.

## What Is a Spine Specialist and When Should You See One?

Your spine is at the center of every move you make. Even a slight misalignment can interfere with the nervous system responsible for how well you sleep, concentrate, and move.

A chiropractor is a spine specialist who keeps your spinal column in the best possible shape — even when you don't realize something is wrong. Regular chiropractic visits help maintain spinal wellness.

### When to See a Spine Specialist

Schedule an appointment if you suffer from neck, back, or shoulder pain; limited range of motion; headaches or migraines; fibromyalgia or arthritis; balance issues; tingling or numbness in the extremities; or digestive issues.

### How We Help

At our Sulphur Springs office, we use spinal adjustments, spinal decompression, soft tissue therapies including therapeutic massage, and electrical muscle stimulation to build a plan customized to your needs.

Don't leave your spinal health to chance. Call ${SS_PHONE} to schedule with our Sulphur Springs office.`,
    },
    {
      slug: "injury-rehab",
      title: "Injury Rehab",
      metaDescription:
        "Injury rehabilitation at Chiropractic Associates of Sulphur Springs, TX. Personalized recovery after auto accidents, sports injuries, and daily wear-and-tear.",
      body: `At Chiropractic Associates of Sulphur Springs, Texas, we know that recovering from an injury can be a challenging journey. Whether you've been hurt in an accident, sports, or gradual wear-and-tear, our team supports your recovery with natural, function-focused care.

## Understanding the Rehabilitation Process

Injury rehabilitation starts with a thorough assessment — physical exam, review of your history, and questions about daily habits — so we address underlying causes, not just symptoms.

## Personalized Treatment Plans

Our treatments may combine chiropractic adjustments, therapeutic exercises, electrical stimulation, ultrasound, and spinal decompression. Each component is chosen to reduce pain, restore function, and help you become more resilient.

Chiropractic adjustments restore proper alignment and motion to the spine and other joints, relieving nerve pressure and supporting natural healing.

## Therapeutic Exercise for Strength and Stability

We guide you through exercises specific to your injury, focusing on strength, flexibility, and proper movement patterns so the affected area stabilizes for the long term.

## Ongoing Support and Education

We explain your condition, options, and self-care strategies so you can take an active role in recovery. We don't push lengthy prepayment plans — our goal is efficient care that gets you back to the activities you love.

Call ${SS_PHONE} to schedule injury rehab at our Sulphur Springs office.`,
    },
    {
      slug: "therapeutic-massage",
      title: "Therapeutic Massage",
      metaDescription:
        "Therapeutic massage at Chiropractic Associates of Sulphur Springs, TX. Licensed massage therapists coordinate soft-tissue work with your chiropractic care plan.",
      body: `Therapeutic massage at our Sulphur Springs office is performed by licensed massage therapists and coordinated with your chiropractic care plan. Soft-tissue work between adjustments helps muscles release, improves circulation, and supports your recovery.

## What We Offer

Our therapists provide deep tissue work, trigger point therapy, gentle lymphatic massage, and relaxation massage. Whether you are recovering from an injury, managing chronic tension, or simply need to unwind, we will match the technique and pressure to your needs.

## Massage and Chiropractic Together

Massage and chiropractic care complement each other. Relaxed muscles hold adjustments longer, and properly aligned joints let soft tissue heal without being pulled back into old patterns. Many of our patients alternate massage visits with adjustments as part of their wellness plan.

To book a massage or ask how massage can fit into your treatment plan, call our Sulphur Springs office at ${SS_PHONE}.`,
    },
  ];
}
