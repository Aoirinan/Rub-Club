/**
 * Marketing copy for Chiropractic Associates & The Rub Club (Paris / Sulphur Springs).
 * Paraphrased from prior public-site language; facts (providers, phones, addresses, awards) kept accurate.
 */

/** Short home-page blurb linking to dedicated SEO routes. */
export const HOME_INTRO = {
  title: "Chiropractic and massage in Paris, TX",
  body: "Chiropractic Associates and The Rub Club operate from one Paris address, with chiropractic care also available in Sulphur Springs. Use the pages below for services, provider bios, video, hours, and online booking.",
} as const;

export const CHIRO = {
  spineHeadline: "Your Spine Health Specialists",
  spineSub: "A more comfortable, active life is closer than you think.",
  chooseTitle: "Choose Our Chiropractors",
  chooseLead:
    "Since 1998, Dr. Gregory Thompson, Dr. Sean Welborn, and Dr. Collins at Chiropractic Associates have delivered full-service chiropractic care to families across Northeast Texas and Southeast Oklahoma from Paris—and we now welcome patients at a second office in Sulphur Springs, TX.",
  chooseP2:
    "Alongside skilled adjustments, our family-owned clinic offers spinal decompression, hands-on therapeutic care, and rehab-focused exercise—including coach-led stretching when you need extra support. Up-to-date evaluation and treatment approaches help us ease a wide range of conditions while keeping visit counts reasonable whenever it is clinically appropriate.",
  chooseP3:
    "If you are not living with chronic disease or long-standing pain, you are unlikely to hear us recommend open-ended treatment plans or prepaid packages. We focus on efficient, cost-conscious care that targets the symptoms you are feeling now. Common issues we help with include:",
  conditions: [
    "Back and neck pain",
    "Knee pain",
    "Sciatica",
    "Herniated discs",
    "Pinched nerves",
    "Auto injuries",
  ],
  treatmentsIntro: "To maximize the benefits, we offer a combination of some of the following treatments:",
  treatments: [
    "Chiropractic adjustments and manipulations",
    "Therapeutic massage, including lymphatic massage, and trigger point therapy.",
    "Electric muscle stimulation therapy",
    "Moist heat and cryotherapy",
    "Intersegmental traction and spinal decompression therapy",
    "Acupuncture",
    "Pediatric care",
  ],
  awards:
    "Because of the breadth of services we offer and the relationships we have built locally, readers of The Paris News have honored us as “Best Chiropractic Center” every year since 2005 and “Best Place for Massage” since 2008.",
  contactUsTitle: "Contact Us!",
  mission:
    "We want every visit to feel calm, respectful, and a step above what you expected. Dr. Thompson, Dr. Welborn, and the Chiropractic Associates team are here to deliver that level of attention.",
  bookCta:
    "Do not let pain or stiffness decide your schedule for you. If you need chiropractic care in Paris or Sulphur Springs, call 903-785-5551 (Paris) or 903-919-5020 (Sulphur Springs) and we will help you find a time that works.",
  stretchP1:
    "We’ve added a new service that will help clients who need more focus on stretching and flexibility!",
  stretchP2: "Ask us about Stretch & Flex Rehab when you call or at your next visit—we will explain how it fits your goals.",
  stretchCallPart1: "Call us to get",
  stretchCallPart2: "STRETCHED today!",
  betterTitle: "A Better Care Experience",
  teamHelpTitle: "How Our Team Can Help",
  teamHelpBody:
    "From the front desk to the treatment rooms, our staff focuses on clear communication and careful, patient-first service so Paris-area families feel looked after at every step.",
  qualityTitle: "Quality Services",
  qualityBody:
    "We stay current on the equipment and methods that support safe, effective visits. Retail items such as Bio Freeze, Natural Calm, ice packs, lumbar supports, and related self-care products are available on site.",
  mainOfficeTitle: "Main Office",
  mainOfficeBody:
    "3305 NE Loop 286, Suite A — Paris, TX. Main chiropractic line: 903-785-5551.",
  secondLocationTitle: "Second Location",
  secondLocationBody: "207 Jefferson St. E, Sulphur Springs, TX. Phone: 903-919-5020.",
  introVideoHeading: "Watch our 30-second video to learn more about Chiropractic Associates.",
} as const;

/** MP4 served on the public Chiropractic Associates homepage (CMS path unchanged as of integration). */
export const CHIRO_INTRO_VIDEO_SRC =
  "https://www.chiropracticparistexas.com/storage/app/media/sedona/paris-chiropractic-associates-jgtvt8zzw-9037855551.mp4" as const;

export const MASSAGE = {
  heroTitle: "Relaxing Therapeutic Massage Services",
  stressTitle: "Say Good-bye to Everyday Stress",
  stressParas: [
    "The Rub Club offers professional massage tailored to real-life needs—from prenatal sessions that help you prepare for delivery to focused work after sports injuries. Licensed therapists coordinate closely with our chiropractic providers when your care plan calls for it.",
    "Together we choose techniques and visit frequency that match your goals, whether that means maintenance care or a short, structured plan for a specific issue. Questions? Call the massage desk at 903-739-9959.",
    "For more than fifteen years we have partnered with pain-management providers to support medically appropriate soft-tissue care. We are family owned, Paris Chamber of Commerce members, and glad to treat guests of every age.",
  ],
  whenTitle: "When To Get a Massage",
  whenBody:
    "Our therapists are experienced with medically oriented massage. After a car accident or surgery, muscles often guard and compensate in ways that create new sore spots—we help unwind that tension. Expecting mothers receive prenatal sessions designed for comfort and safer positioning. Athletes rely on us for sports massage that supports recovery without rushing tissue before it is ready.",
  treatmentsTitle: "Treatments We Offer",
  treatmentsIntro:
    "Because no two bodies respond the same way, we build a menu of services you can mix and match. Popular options include:",
  treatmentsList: ["Sports massage", "Prenatal massage", "Deep-tissue massage"],
  closingTitle: "The Rub Club",
  closingParas: [
    "Ready to feel better in your own skin? We are honored to care for Paris-area families who want dependable, down-to-earth massage. Stop by 3305 NE Loop 286, Suite A, or dial (903) 739-9959 and we will reserve a time that fits your calendar.",
    "All ages are welcome in our locally owned clinic. We are Paris Chamber of Commerce members, and local readers have recognized us as the top massage spot in Paris, TX, for nine years running.",
  ],
  contactTitle: "CONTACT US",
  hoursTitle: "Office Hours",
  hoursSubtitle: "Find Out When We Are Open",
  hours: [
    { day: "Monday", hours: "9:00 AM – 5:00 PM" },
    { day: "Tuesday", hours: "9:00 AM – 5:00 PM" },
    { day: "Wednesday", hours: "9:00 AM – 5:00 PM" },
    { day: "Thursday", hours: "9:00 AM – 5:00 PM" },
    { day: "Friday", hours: "9:00 AM – 5:00 PM" },
    { day: "Saturday", hours: "Closed" },
    { day: "Sunday", hours: "Closed" },
  ],
  locationTitle: "Our Location",
  rubClubAddressTitle: "The Rub Club",
  rubClubAddressLines: ["3305 NE Loop 286 Suite A", "Paris, TX 75460"],
} as const;

/** Chiropractic providers — bios summarized from public practice pages. */
export const DOCTORS = [
  {
    name: "Dr. Greg Thompson",
    role: "Chiropractor",
    imageKey: "doctorGreg" as const,
    bio: "A Dallas native and Parker College of Chiropractic graduate, Dr. Thompson has led Chiropractic Associates in Paris since the late 1990s. He focuses on efficient, patient-centered care and founded The Rub Club so on-site therapeutic massage could support the same treatment goals.",
    videoFile: null as string | null,
  },
  {
    name: "Dr. Sean Welborn",
    role: "Chiropractor",
    imageKey: "doctorSean" as const,
    bio: "Dr. Welborn earned his doctorate from Parker University and brings experience in high-volume chiropractic and rehab settings plus acupuncture for muscle and joint complaints. He is fluent in Spanish and welcomes patients who have struggled to find lasting relief elsewhere.",
    videoFile: null as string | null,
  },
  {
    name: "Dr. Brandy Collins",
    role: "Chiropractor",
    imageKey: "doctorCollins" as const,
    bio: "Originally from Kentucky, Dr. Collins graduated from Parker Chiropractic College and cares for the whole family—from infants to seniors. She blends gentle low-force options with traditional adjustments, myofascial release, instrument-assisted care, and pregnancy-focused visits when appropriate.",
    videoFile: null as string | null,
  },
] as const;

export const TEAM = [
  {
    name: "Ana Vasquez",
    imageKey: "staffAna" as const,
    bio: "I am Ana Vasquez, originally from Los Angeles, where I studied at California Arts College in 2001 before relocating to Texas and completing massage school. Helping clients unwind while easing pain, tension, and daily stress is what drew me to this work.",
  },
  {
    name: "Shely Cox",
    imageKey: "staffShely" as const,
    bio: "I am Shely Cox and have been part of The Rub Club since the summer of 2022. I graduated from Body Business School in Durant, OK, in 2020, teach fifth grade in Antlers, OK, and especially enjoy Swedish techniques that leave people feeling lighter.",
  },
  {
    name: "Rosylin Wilmore",
    imageKey: "staffRosylin" as const,
    bio: "I am Rosylin—Clarksville born, Tulia raised—and after three decades in San Diego I returned home to East Texas. Concorde Career Institute prepared me for a twelve-plus-year career focused on headache relief, trigger-point work, Swedish flow, and assisted stretching, with family time topping my off-hours list.",
  },
  {
    name: "Channety Wooten",
    imageKey: "staffChannety" as const,
    bio: "I am Channety, a Paris High School graduate (2005) who finished massage training at Bodywork Study School of Massage in 2009 and later earned an associate degree in radiology from Paris Junior College. Since 2011 I have blended Swedish, deep tissue, and sports modalities to help patients feel strong and pain free.",
  },
  {
    name: "Brandi Boren",
    role: "LMT/Manager",
    imageKey: "staffBrandi" as const,
    bio: "I am Brandi—married since 2005, mom since 2014, Paris native, and Paris High class of 2003. I graduated from Bodywork Study School of Massage in 2005 and have been with The Rub Club ever since, following several years assisting chiropractic physicians at Chiropractic Associates. Continuing education in deep tissue, trigger point, myofascial release, and fibromyalgia care complements my passion for prenatal work, tension-type headaches, and neck or low-back issues. Outside the office I enjoy the outdoors, hunting, fishing, and family time.",
  },
] as const;
