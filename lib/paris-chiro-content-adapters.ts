import { SS_SERVICES } from "@/lib/sulphur-springs-content";

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

/** Eleven Paris service pages missing from the initial migration. */
export function buildParisChiroServiceAdditions(): ServiceDraft[] {
  const common = ssService("common-chiropractic-conditions");
  const exercise = ssService("therapeutic-exercise");

  return [
    {
      slug: "stretch-and-flex-rehab",
      title: "Stretch & Flex Rehab",
      metaDescription:
        "Stretch & Flex Rehab at Chiropractic Associates in Paris, TX. Attended stretching, aerobic exercise, CORE strengthening, and resistance exercise coordinated with chiropractic care.",
      body: `## WHY STRETCH?\n\nOur rehab coaches use attended stretching techniques that will help your muscles become flexible and have more range of motion. When your body is suffering from stiffness, joint or muscle pain, we forget about the importance of stretching. We believe that our stretching rehab techniques and chiropractor adjustments will help the muscles and also keep the body relaxed. Maintaining a wellness visit will not only reduce the chances but may also prevent injuries and allows your body to react in a positive way during daily activities. Here at our office, we will offer attended stretching, aerobic exercise, CORE strengthening, resistance exercise and instructions for at home stretching.`,
    },
    {
      slug: "auto-injury",
      title: "Auto Injury",
      metaDescription:
        "If you or a loved one have been involved in an auto accident, schedule an appointment with Chiropractic Associates in Paris and Sulphur Springs, TX.",
      body: `## Treat Injuries Caused in Auto Accidents

Pain from an auto accident can linger for years if not properly treated and corrected. Almost all Americans get involved in at least one motor vehicle accident at some point in their lives. Often, we are able to walk away thinking we're free from injury. Little known symptoms can turn into big problems in the future if not treated and corrected.

Injuries resulting from auto accidents are seldom diagnosed correctly. Most often, the symptoms associated with an auto accident type injury may not be present at the time of the accident. It may be several hours or even days after the accident occurs before the symptoms become apparent. Evaluation at the emergency room often focuses strictly on ruling out broken bones or dislocations, leaving underlying soft tissue injuries or mechanical joint abnormalities undiagnosed and untreated.

In most cases, there is insurance that will cover the costs associated with examinations, treatment, and diagnostic testing. The at-fault insurance, personal injury protection, and Medpay are all insurances to be considered for the resulting injuries. We also accept patients whose cases are represented by an attorney.

Don't delay; contact our office for an appointment! We will perform a complete examination of the areas affected in the motor vehicle accident and, if needed, provide appropriate care to assure that you recover from your injuries. Contact our office today!

## We'll Work With Your Attorney or Refer You

Many patients suffering from a car wreck choose to have an attorney represent them. We accept letters of protection and will work with most attorneys. Things to know regarding having an attorney:

- A letter of protection is required and we accept LOPs from most reputable attorneys.
- We refer for outside services such as MRI, CT, or other tests, as well as doctor referrals for pain management, ortho consults, or other appropriate medical services.
- We submit records and billing in a very efficient and timely manner.
- We work with attorneys to assist with the settlement of cases.

One moment everything may seem fine, when suddenly you're involved in a serious collision. Most people have one thing on their mind after a car accident—their car! However, it's important to remember that you and your injuries come first. A visit to a chiropractor should always follow an auto injury, as chiropractors are specialists in damage to soft and hard tissue.

## How Can a Chiropractor Help Me After My Auto Accident?

Chiropractors are able to treat neck and back injuries associated with auto accidents. Many times, individuals who have been injured in a car accident experience such intense muscle pain and stiffness that they simply cannot function normally. When left untreated, this discomfort can be a serious issue.

After an auto accident, some individuals experience indicators of whiplash injuries right away, such as blurred vision, headaches, shoulder pain, dizziness, reduced range of motion and arm pain. Whiplash can also result in minor back injuries, muscle injuries, ligament problems, and disc damage. Other individuals may be injured and feel nothing at all.

Treating pain or whiplash should never be secondary to bringing your car at the mechanic or working with your insurance company. If you've had an auto accident recently, your first priority should be taking the initiative to visit your chiropractor!`,
    },
    {
      slug: "personal-injury",
      title: "Personal Injury",
      metaDescription:
        "Personal injury chiropractic treatment in Paris, TX. Treatment for auto accidents, construction injuries, and other bodily harm.",
      body: `Personal injury is defined as bodily harm that comes from being involved in any type of accident or mishap such as:

- Automobile accidents
- Bike and pedestrian collisions
- Boat and airplane accidents
- Construction accidents
- OSHA violations
- Medical malpractice

Chiropractors are professionals who uncover issues stemming from the spine or nervous system in personal injury accidents. Whether using a single spinal adjustment or a series of treatment, visiting a chiropractor is one of the best options to start the healing process.

If you find yourself in a personal injury accident, schedule a consultation with a chiropractor, as you may have issues that we can help treat.`,
    },
    {
      slug: "sports-injury",
      title: "Sports Injury",
      metaDescription:
        "When you need a sports chiropractor in Paris, TX, look no further than Dr. Thompson, Dr. Collins, and Dr. Welborn. Call Chiropractic Associates today.",
      body: `Are you an athlete who needs to improve your game or recover from injury? Your local chiropractors in Paris, TX, are ready to assist you. At Chiropractic Associates, Dr. Gregory Thompson, Dr. Brandy Collins, and Dr. Sean Welborn understand your time is valuable. They work hard to ensure that you'll find relief for your sports-related condition in as short of a time as possible. They use a range of technology and methods to treat you.

## What Is Sports Chiropractic Care?

Professional athletes may incur frequent injuries or chronic pain. Therefore, some chiropractors focus their skill set on the particular needs of the athletic body. Athletes tend to work their muscles, ligaments, and tendons more than an average person. They may develop issues with their knees, Achilles tendons, elbows, or shoulders. Thanks to a balance of massage therapy and chiropractic adjustments that work the ligament muscles and tendons, your local chiropractor in Paris, TX, can help with these issues.

## What Can Sports Care Involve?

Treatment is personalized and caters to the specific needs of the active patient. Relief from sports-based injuries may include manual adjustments or a handheld activator. There are a range of therapeutic massage therapies available at Chiropractic Associates. Get a sports massage, Swedish massage, or deep tissue massage. Each massage technique can work different layers of the muscles and tendons. As strained or pulled muscles ease up from sports injuries, it makes it easier for the chiropractor to make necessary adjustments to the spine as well. Proactive sports massages can help get the patient warmed up and prevent injury. Getting the same massage after an event can also target muscle soreness and prevent stiffness that may linger over the next few days.

If you're trying to recover from an injury, one of your chiropractors at Chiropractic Associates may opt to use electric muscle stimulation or EMS. It involves using a series of electrodes that attach to your skin. These electrodes serve as a pathway for electrical pulses to go to your muscles. The pulses force your muscles to contract and help increase their strength and ease tension. It's a highly stimulating treatment that can prevent muscle atrophy.

Getting prompt treatment for your sports injuries and lingering pain can improve your quality of life. It can also help you perform better on the field for a long period. When you need a chiropractor in Paris, TX, look no further than Dr. Thompson, Dr. Collins, and Dr. Welborn. Call Chiropractic Associates in Paris, TX, at ${PARIS_PHONE} or the Sulphur Springs, TX, office at 903-919-5020.`,
    },
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
