/**
 * Content for the Sulphur Springs office pages.
 * Staff bios, service descriptions, injury pages, patient resources, and Q&A
 * sourced from chiropracticsulphursprings.com.
 */

import type { FaqEntry } from "@/lib/faqs";

/* ------------------------------------------------------------------ */
/*  Staff                                                              */
/* ------------------------------------------------------------------ */

export type SSStaffMember = {
  name: string;
  role: string;
  bio: string;
};

export const SS_STAFF: readonly SSStaffMember[] = [
  {
    name: "Dr. Conner Collins",
    role: "Chiropractor",
    bio: "Dr. Connor Collins is a chiropractor who takes a practical, hands-on approach to patient care, focusing on getting people out of pain and back to doing what they love. He specializes in treating spine and extremity conditions, including injuries from motor vehicle collisions and chronic musculoskeletal issues.\n\nBefore entering the healthcare field, Connor grew up working blue-collar jobs, including construction, oil fields, and cowboying. That background gives him a unique perspective on how the body moves, breaks down, and recovers—especially for patients who work hard physically. He understands the demands of that lifestyle and tailors his treatment approach to match real-world function, not just textbook outcomes.\n\nDr. Connor uses a combination of chiropractic techniques, including diversified, drop table, and Activator methods, along with soft tissue therapy, therapeutic exercise, and mechanical traction to help restore movement, reduce pain, and improve overall function. Outside of the clinic, he enjoys riding horses, working on his farm, and spending time outdoors. His goal is simple: help patients feel better, move better, and get back to living their lives.",
  },
  {
    name: "Jade Petty",
    role: "Receptionist",
    bio: "",
  },
  {
    name: "Taylor Harrison",
    role: "Receptionist",
    bio: "",
  },
  {
    name: "Leotta Cascia",
    role: "Massage Therapist",
    bio: "",
  },
  {
    name: "Brittany Brown",
    role: "Massage Therapist",
    bio: "",
  },
  {
    name: "Ashlyn Davis",
    role: "Rehab Therapy",
    bio: "",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

export type SSService = {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
};

export const SS_SERVICES: readonly SSService[] = [
  {
    slug: "acupuncture",
    title: "Acupuncture",
    metaDescription:
      "Acupuncture treatment at Chiropractic Associates of Sulphur Springs. Ancient Chinese medicine used to alleviate pain and promote overall health.",
    body: `Acupuncture is an ancient Chinese medicine used to alleviate pain and promote overall health. Acupuncture uses needles placed along invisible meridians that run throughout the body. Today, acupuncturists also use lasers, magnets and electric pulses in addition to needles. Each meridian point has a specific meaning and can unblock and repair meridians and channels with vital energy or chi. Through the stimulation of the meridians, an acupuncturist is able to restore balance and ergo health to the patient.

Acupuncture is used to treat a wide range of health problems, such as:

- Persistent lower back pain
- Chronic tension-type headaches and migraines
- Neck pain
- Joint pain
- Postoperative pain
- Allergies
- Depression and anxiety
- Insomnia

Acupuncture takes a holistic approach to understanding normal function and disease processes, and focuses as much on the prevention of illness as on the treatment.`,
  },
  {
    slug: "adjustments-and-manipulation",
    title: "Adjustments and Manipulation",
    metaDescription:
      "Chiropractic adjustments and spinal manipulation at our Sulphur Springs office. Relieves pressure on joints, reduces inflammation, and improves nerve function.",
    body: `A chiropractic adjustment, also known as chiropractic manipulation, manual manipulation, or spinal manipulation, is the primary chiropractic treatment method for back pain.

Spinal manipulation relieves pressure on joints, reduces inflammation, and improves nerve function. It has been a trusted form of treatment since the ancient Greek Hippocrates documented manipulative techniques in his writings back in 1500 B.C. Today, spinal manipulation is used to treat conditions such as allergies, menstrual cramps and headaches.

## How Does Spinal Manipulation Work?

There are well over 100 types of adjustment techniques used by chiropractors throughout the world. Some practitioners may use force and twisting, while other techniques are more gentle. Regardless of how they are performed, these techniques are intended to restore or enhance joint function with the objectives of reducing pain and resolving joint inflammation.

When vertebrae shift out of place, there is an overall systemic response from the muscular system to the central nervous system. Without proper alignment and flow, our nerves, our immune system, and our minds cannot function at their highest peak.

Overall, spinal adjustments and manipulations are an excellent way to keep the body functioning at its highest level without any discomfort. When the body is adequately aligned, it becomes able to respond and perform as it was built to do.`,
  },
  {
    slug: "common-chiropractic-conditions",
    title: "Common Chiropractic Conditions",
    metaDescription:
      "Learn about common conditions treated at our Sulphur Springs chiropractic office, including allergies, disc problems, whiplash, sciatica, and more.",
    body: `## Allergies

Chiropractic can help reduce the severity and the frequency of your allergies. Chiropractic does not work like an anti-histamine as a direct, short term relief from allergies. Chiropractic allows your body to be better equipped to fight against allergies. Allergies are a reaction by your immune system to an allergen (substances that normally have no effect on people) resulting in sneezing, coughing, congestion, hives, rashes, and in severe cases, seizure and anaphylactic shock. These symptoms are caused by the histamines your immune system creates in an attempt to protect your body against the allergen. When your spine is misaligned it can impinge on the nervous system in your body. Studies have shown that the nervous system has an effect on the functionality of your immune system. When your nervous system is under stress and not functioning properly, your immune system cannot work at an optimal level. Chiropractors work with the nervous system by aligning the spine to relieve any stress on nerves. This allows the immune system to work at a higher level, making it easier to fight off infections while recognizing allergens. When your immune system recognizes allergens, it will not overreact to them, or at least not react as severely to them.

## Disc Problems

Intervertebral discs are positioned between the vertebrae in the spine. The outside of a disc is made from cartilage, and in the center is a jelly like solution. These discs serve many purposes, including allowing movement of the spine, creating space between the vertebrae, and acting as shock absorbers. The gelatinous middle allows the disc to compress and expand based on impact and movement. Trauma to the spine can cause the discs to herniated, bulge, become displaced (slipped disc), or even rupture. Trauma or direct injury to the area is not the only cause, however. As we get older, the discs can begin to weaken and dehydrate. These conditions can put pressure on the nerves around the spine and cause pain. If you suffer from one of these injuries you should see a chiropractor. Surgery is risky, expensive, and requires recovery time. In many cases, you can experience relief from these conditions through chiropractic. By properly aligning the spine, pressure can be relieved on nerves and on the discs themselves. This will reduce and hopefully eliminate your pain and discomfort and allow you to live a normal lifestyle.

## Whiplash

Whiplash is a common injury for people involved in car collisions. When a car is struck from behind or collides with another object, it causes the neck to snap back and forth violently. This causes the muscles and ligaments to overextend, leading to strains and/or tears. This is referred to as soft tissue damage, and can cause stiffness and soreness. Whiplash can also cause structural damage such as misaligned vertebrae, herniated, bulging or ruptured discs, or nerve damage due to the overextension from the violent movement. Chiropractic can help with both types of injuries. Adjustments and alignments can be performed specifically for those who have been in car accidents and suffered from whiplash. The pressure on the discs and nerves is released when the spine is returned to its proper alignment. Chiropractic massage can be used to help relieve the pain and discomfort from soft tissue injuries. If you have been in a car accident, schedule an appointment with us before relying on pain medications and surgery.

## Osteoarthritis

Arthritis is a condition that is caused by the wearing down of the cartilage between joints. Some of the major joints that are affected are the knees, hips, back, neck, and hands/wrist. Arthritis can be painful and can cause the affected areas to not function properly. Arthritis in one area can cause arthritis or other problems in a different joint. For instance, if you have arthritis in your left knee, you may compensate for this by putting more pressure on your right side, leading to right hip problems. Pain killers can cause temporary relief from pain and discomfort, but it is not a long term solution. Chiropractic can alleviate pain by releasing pressure on the nervous system with proper alignment. It can also restore proper joint movement, helping to ensure that you use proper motion so that you do not cause injury to other parts of your body. We are not concerned strictly with the affected area, but rather the body as a whole. We aim to restore and maintain proper movement and functionality to increase your overall well being.

## Joint Dysfunction

Joint dysfunction occurs when joints become stiff and full movement is restricted. It can be caused by an injury, poor posture, overuse/underuse of a joint, muscle imbalance, as well as other factors. Like arthritis, joint dysfunction can cause pain in the joint and the surrounding muscles, and can also cause problems in other parts of the body due to overcompensation. One common form of joint dysfunction is sacroiliac joint dysfunction, which occurs where the base of the spine meets the pelvis. It causes low back pain and prohibits movement. This condition is often misdiagnosed because the symptoms are similar to sciatica or a herniated disc. Your chiropractor can properly diagnose this condition and provide relief. Using specific adjustments for the affected joint can return proper mobility and relieve pain.

## Neck/Back Pain

Pain along the spinal column in your neck or back is usually caused by subluxations, or misalignments of your vertebrae. A small misalignment can cause pain by causing pressure on nerves. Left untreated, these subluxations can cause muscle spasms and increasing pain. Chiropractic adjustments properly align your spine so that pressure on joints and nerves is released. It is a direct treatment for the cause of the pain, not a temporary relief like pain relievers or massage.

## Headaches

Many people believe that headaches are caused by loud noise, being tired, or being stressed. While these are all factors that can lead to headaches, the direct cause is tightness in the neck and shoulders. The tightness can cause misalignments in the vertebrae of your neck, resulting in pain. 80% of all headaches originate from the neck. With a typical cervicogenic (neck origin) headache, a person usually feels pain starting at the base of the skull which radiates into the temples, eyeballs, and forehead. Massage of the neck and shoulder muscles can release tension, and a chiropractic adjustment can realign the vertebrae in your neck. Chiropractic can help eliminate the cause of your headaches rather than offering a temporary relief from the symptoms.

## Sciatica

Sciatica is a condition that results when the sciatic nerve becomes irritated. Bulging discs, spinal subluxations, and muscle spasms can all cause increased pressure on the sciatic nerve. When this happens it causes pain, numbness, and weakness in the lower back and leg. To properly treat sciatica the cause of the condition needs to be diagnosed and properly treated. Your chiropractor can help you do this.

## Pinched Nerve

When a nerve is squeezed or compressed it is called a "pinched nerve". This can be caused by spinal misalignments, bulging or herniated discs, or other factors. The increased pressure on the nerve causes inflammation, pain, and sometimes muscle spasms. The pressure on the nerve must be relieved in order to alleviate the pain. An examination can reveal the cause of the pain, and an adjustment can relieve the pain by properly aligning the spine and addressing the cause of the pain.

## Carpal Tunnel Syndrome

This condition is most commonly associated with people who are constantly using a computer. Typing is a motion that, when performed repetitively and with poor posture, can cause carpal tunnel syndrome. Symptoms include pain, numbness, weakness, or a burning sensation. The nerves in the fingertips travel through the wrist, up the arm, and into the neck. The spine is the center of the nervous system, and the pain in your hands and wrists can be relieved by your chiropractor with concentrated spinal and joint adjustments.

## Maintenance Care

We have discussed many conditions that can be relieved through chiropractic. The best way to treat these conditions is to prevent them before they even start. Regular chiropractic visits can help to prevent physical problems and injuries from occurring. Other potential benefits of regular chiropractic visits are increased flexibility and mobility, higher level of energy, improved posture, more effective immune system, better circulation, and an overall better feeling of well-being.

## Fibromyalgia

Fibromyalgia is a condition that we still do not know much about. There is no specific known cause, and it could be brought on by many different factors. The main symptom of fibromyalgia is chronic pain throughout the body, mainly located in joints. The pain may be achy, sharp, radiating, burning, or shooting and it may be mild or severe. Fibromyalgia has also been known to bring on other conditions like trouble sleeping, headaches, depression, and anxiety. While there is no known cure for fibromyalgia, chiropractic treatment can help to uncover what may be causing the pain and also provide relief for the pain. The cause of fibromyalgia could be physical, mental, or emotional, so a full examination will be performed. Adjustments and chiropractic massage can be used to relieve pain from the affected areas. The added effects of chiropractic treatment such as increased energy levels, better circulation, and a stronger immune system can also help to fight the effects of fibromyalgia.`,
  },
  {
    slug: "degenerative-disc-disease",
    title: "Degenerative Disc Disease",
    metaDescription:
      "Learn about degenerative disc disease treatment at our Sulphur Springs chiropractic office. Symptoms, causes, and non-surgical treatment options.",
    body: `## What is Degenerative Disc Disease?

Degenerative disc disease is not as much a disease as it is a name for the changes that can happen to the spine as we age.

Our discs are made of a tough, rubbery exterior and a soft interior. They sit between the vertebrae to act as shock absorbers. As we age, the spinal discs begin to degenerate. This can cause herniated discs, bulging discs, spinal stenosis, and osteoarthritis.

## Degenerative Disc Symptoms

The degeneration of spinal discs may cause no symptoms at all, and symptoms depend on each patient and the severity of their case.

Pain may occur at the site of the affected disc in the back or neck. As the pain is often caused by compressed nerves, this pain can also travel to other areas of the body like the buttocks, arms, and legs. Numbness and tingling in the arms and legs may also be experienced. Pain can range from mild to severe and debilitating.

## Degenerative Disc Causes

As mentioned previously, our spines can degenerate as a natural part of aging. Tears in the tougher outer layer of the disc are common as we grow older, and when the discs begin to lose fluid, they become smaller and less flexible.

In addition to aging, other factors that may come into play, including obesity, smoking, repeated physical work, and injury.

## Degenerative Disc Treatment

Pain caused by degeneration is often treated with hot or cold packs and an anti inflammatory medication. When disc degeneration causes problems like herniated or bulging discs, spinal stenosis, or osteoarthritis, other forms of treatment may be beneficial. This may include physical therapy, stretching, and in some cases, surgery. While degenerative disc disease is a natural part of aging, there are things you can do to prevent pain and stay healthy. If you are experiencing frequent back or neck pain, be sure to visit our office for an examination so we can create a treatment plan for you.`,
  },
  {
    slug: "electrical-muscle-stimulation",
    title: "Electrical Muscle Stimulation",
    metaDescription:
      "Electrical muscle stimulation (EMS) therapy at our Sulphur Springs office. Reduce pain, swelling, and recovery time for soft tissue injuries and muscle spasms.",
    body: `Electrical muscle stimulation (EMS) is a treatment method being used to reduce pain, swelling, and recovery time. This increasingly popular treatment works well for soft tissue injuries, muscle spasms, and even for athletes who want quicker recovery from workouts.

## How Does Electrical Muscle Stimulation Work?

This treatment is performed here in our office, and usually only takes a few minutes. Electrodes are placed on the skin over the affected area, and the machine is turned on. An electrical current is then transmitted into the soft tissue or muscle. The level of current used depends on the injury, its location, and how deep the therapy will be. This electrical current causes the muscles to experience very small but quick contractions. During the treatment, patients may feel a prickly or tingling sensation; however, these sensations will subside after the machine is turned off, or shortly afterward. Many patients enjoy the sensation.

Electrical muscle stimulation creates tiny contractions in the muscles so they become tired and relax, relieving pain and muscle spasms. In addition, it triggers the release of endorphins, which are our body's natural pain reliever. The process is also said to clear metabolic waste so nutrients can be better delivered and soft tissue can heal more quickly.

Back muscles and neck muscles are common locations for EMS; however, there are many areas of the body that can experience the benefits of this treatment.

Electrical muscle stimulation works well for both acute and chronic pain. If you have been struggling with pain or have recently suffered an injury, ask your chiropractor if electrical muscle stimulation is right for you.`,
  },
  {
    slug: "ice-pack-cryotherapy",
    title: "Ice Pack Cryotherapy",
    metaDescription:
      "Ice pack cryotherapy at our Sulphur Springs chiropractic office. Cold compress therapy to reduce pain, swelling, and inflammation.",
    body: `Ice pack cryotherapy consists of applying cold compresses to the skin, both to reduce its temperature and constrict blood vessels in the area. Applied to fresh injuries, it can help reduce pain, swelling, and inflammation.

You are likely already familiar with the use of ice to bring down swelling after spraining an ankle or knocking your shin. But did you know that ice pack cryotherapy can be beneficial well after you suffer your initial injury?

## Treatment and Benefits

Ice pack cryotherapy is an excellent way to help with muscle spasms, and is known to help numb painful areas while providing a cooling relief to the affected soft tissues. Commonly used in sports medicine, its power to ease pain and decrease inflammation can be helpful to those in rehabilitation programs for injuries or who have chronic pain.

Interested in learning more about the power of ice pack cryotherapy? Contact your chiropractor for an appointment today.`,
  },
  {
    slug: "postural-rehabilitation",
    title: "Postural Rehabilitation",
    metaDescription:
      "Postural rehabilitation and Posture Pro assessment at our Sulphur Springs chiropractic office. Digital posture analysis and one-on-one rehab exercises.",
    body: `Spinal rehabilitation is offered at Chiropractic Associates. This service, called Posture Pro, assesses your posture via digital images to determine if areas of your spine are weak or suffering from an imbalance.

Once we determine which muscles need attention, we'll work you through one-on-one rehabilitative exercises. Low-tech rehab equipment, like body balls, will be used in order to provide you with exercises that can be easily done at home once you demonstrate clinical competence.

To schedule an appointment for postural rehabilitation, call Chiropractic Associates at (903) 919-5020.`,
  },
  {
    slug: "spinal-decompression",
    title: "Spinal Decompression",
    metaDescription:
      "Non-surgical spinal decompression therapy at our Sulphur Springs office. Advanced computer-guided treatment for herniated and bulging discs.",
    body: `Back pain due to a herniated or bulging disc can be debilitating, and in the past, surgery was the answer. Today, we have highly-successful advanced technology that allows us to relieve this pain without surgery. We use a system that combines a machine with an exceptionally precise computer program for a treatment called spinal decompression.

Using this computer technology and the decompression machine, we are able to create a custom treatment plan that decompresses the spine and pulls the herniated or bulging material back into the disc. The computer program is created and supervised by one of our highly trained staff. It gently stretches and relaxes the spine in rotation, which, over time, separates the vertebrae. This creates a vacuum-like effect that pulls the soft bulging disc material back into the disc. This can not only clear up back pain, but also any pain caused by the pressure put on the nerves. For example, patients who have a herniated disc in the lower back may have shooting sciatic pain down their legs. Relieving the herniated disc will cause that pain to vanish.

Treatment time and frequency will depend on each patient's unique condition; however, each spinal decompression treatment is usually about twenty minutes. Patients usually have treatment a few times a week, and are typically finished with treatment within eight weeks.

If you are living in pain from a herniated or bulging disc, we will work with you to find a spinal decompression treatment plan that corresponds with your body. Instead of turning to dangerous pain medications that just cover up the problem, ask us if spinal decompression can help you.`,
  },
  {
    slug: "therapeutic-exercise",
    title: "Therapeutic Exercise",
    metaDescription:
      "Therapeutic exercise programs at our Sulphur Springs chiropractic office. Regain flexibility, strength, and endurance for specific physical problems.",
    body: `Therapeutic exercises are specific exercises meant for correcting specific problems. Depending on the matter of your concern, your chiropractor may give you a list of exercises to perform to reduce discomfort. The focus of therapeutic exercise is to regain flexibility, strength, and endurance related to specific physical problems.

Therapeutic exercise aims to improve, restore, and prevent loss of physical function. It can also improve a patient's overall health, fitness, and sense of well-being.

Additional objectives of therapeutic exercise include:

- Increasing mobility
- Releasing contracted muscles, tendons, and fascia
- Mobilizing joints
- Improving circulation
- Improving respiratory capacity
- Improving coordination
- Reducing rigidity
- Improving balance

Therapeutic exercises are classified into three major categories:

- Endurance training
- Resistance training
- Flexibility training

No matter what type of exercise is prescribed to remedy a patient's specific condition, the final goal of rehabilitation is to acquire a maximum level of physical fitness, without the use of more invasive methods. Therapeutic exercise can be performed at home, and gives you the power to improve your quality of life.`,
  },
  {
    slug: "therapeutic-ultrasound",
    title: "Therapeutic Ultrasound",
    metaDescription:
      "Therapeutic ultrasound treatment at our Sulphur Springs chiropractic office. Non-invasive therapy for soft tissue injuries, joint pain, and muscle spasms.",
    body: `Therapeutic ultrasound is utilized for injuries related to most soft tissues, joints and muscle spasms. While it shares the same name, this ultrasound is not the same as that used diagnostically to screen the body internally.

## What is Therapeutic Ultrasound?

Ultrasound emits small sound waves at an extremely high frequency that is out of the range of human hearing. When applied to problem areas in soft tissues and joints, it produces heat that helps reduce inflammation and increase blood flow, in addition to decreasing pain, stiffness, and spasms. Therapeutic ultrasound is also believed to have a positive effect on the healing process.

## How Does Therapeutic Ultrasound Work?

While its effects and goals are different from ultrasound screening technologies, ultrasound therapy is implemented in much the same way. The process may be familiar if you've ever had an ultrasound screening in the past.

An ultrasound emitting 'wand' will be passed over your skin across the pain point or injury. We will apply ultrasound gel to your skin to reduce friction and allow for better transmission of the ultrasound waves. Despite the deep-tissue heat applied during the therapy, you typically will feel little or no heat at all.

Therapeutic ultrasound has been shown to facilitate the body's healing process at the most basic cellular level. Contact our office today to discuss whether therapeutic ultrasound may be beneficial to you on your road to recovery.`,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Injuries                                                           */
/* ------------------------------------------------------------------ */

export type SSInjury = {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
};

export const SS_INJURIES: readonly SSInjury[] = [
  {
    slug: "auto-injury",
    title: "Auto Injury",
    metaDescription:
      "Auto injury treatment at our Sulphur Springs chiropractic office. Don't let car accident pain linger — get examined and treated properly.",
    body: `## Treat Injuries Caused in Auto Accidents

Pain from an auto accident can linger for years if not properly treated and corrected. Almost all Americans get involved in at least one motor vehicle accident at some point in their lives. Often, we are able to walk away thinking we're free from injury. Little known symptoms can turn into big problems in the future if not treated and corrected.

Injuries resulting from auto accidents are seldom diagnosed correctly. Most often, the symptoms associated with an auto accident type injury may not be present at the time of the accident. It may be several hours or even days after the accident occurs before the symptoms become apparent. Evaluation at the emergency room often focuses strictly on ruling out broken bones or dislocations, leaving underlying soft tissue injuries or mechanical joint abnormalities undiagnosed and untreated.

In most cases, there is insurance that will cover the costs associated with examinations, treatment, and diagnostic testing. The at-fault insurance, personal injury protection, and Medpay are all insurances to be considered for the resulting injuries. We also accept patients whose cases are represented by an attorney.

Don't delay; contact our office for an appointment! We will perform a complete examination of the areas affected in the motor vehicle accident and, if needed, provide appropriate care to assure that you recover from your injuries.

## We'll Work With Your Attorney or Refer You

Many patients suffering from a car wreck choose to have an attorney represent them. We accept letters of protection and will work with most attorneys. Things to know regarding having an attorney:

- A letter of protection is required and we accept LOPs from most reputable attorneys
- We refer for outside services such as MRI, CT, or other tests, as well as doctor referrals for pain management, ortho consults, or other appropriate medical services
- We submit records and billing in a very efficient and timely manner
- We work with attorneys to assist with the settlement of cases`,
  },
  {
    slug: "personal-injury",
    title: "Personal Injury",
    metaDescription:
      "Personal injury chiropractic treatment in Sulphur Springs, TX. Treatment for auto accidents, construction injuries, and other bodily harm.",
    body: `Personal injury is defined as bodily harm that comes from being involved in any type of accident or mishap such as:

- Automobile accidents
- Bike and pedestrian collisions
- Boat and airplane accidents
- Construction accidents
- OSHA violations
- Medical malpractice

Chiropractors are professionals who uncover underlying issues in personal injury accidents. Whether using a single spinal adjustment or a series of treatments, visiting a chiropractor is one of the best options to start the healing process.

If you find yourself in a personal injury accident, schedule a consultation with a chiropractor, as you may have underlying issues that we can help diagnose and treat.`,
  },
  {
    slug: "sports-injury",
    title: "Sports Injury",
    metaDescription:
      "Sports injury chiropractic care in Sulphur Springs, TX. Holistic treatment to help athletes reach optimum performance and recover from injuries.",
    body: `Professional athletes are constantly reaching new heights in their professional careers. With each passing year, new records are shattered and the human body is pushed to its limits. Competitors train rigorously and take their diets to a new level every day. Yet despite the conscientious care and precautions that athletes follow, most experience musculoskeletal injuries at one time or another.

Chiropractors are to athletes as cardiologists are to those who suffer from cardiovascular disease. Athletes who receive treatment from a medical doctor find themselves frequently benched and on the sidelines. Others play and then spend hours after the game icing their injuries and taking pain medication. This is because medical doctors do not treat the body as an integrated system, but rather treat each injury individually. Meanwhile, chiropractic treatment offers a balanced, holistic approach, by using spinal adjustments and physical therapy techniques to help the patient's muscles, tendons, and ligaments return to their normal function.

Chiropractic care meticulously tends to the needs of the athlete because special attention is given to the spine, joints, muscles, tendons, and nerves. Additionally, chiropractic care ensures that all pieces of the musculoskeletal system are working harmoniously in their healthiest, most natural state.

Professional athletes recognize tremendous value in chiropractic care because they realize that it helps them maximize athletic performance. Whether you're an athlete or weekend warrior, receiving chiropractic care will enable you to reach an optimum level of achievement without breaking yourself.`,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Patient Resources                                                  */
/* ------------------------------------------------------------------ */

export const SS_PATIENT_RESOURCES = {
  intro:
    "Records from insurance and court cases have constantly shown that chiropractic is the safest portal of entry health care available to the public today. Although no healthcare procedures are 100% safe, chiropractic stands on its record of safety and effectiveness unmatched in healthcare.",
  links: [
    {
      label: "The American Chiropractic Association",
      url: "https://www.acatoday.org/",
    },
    {
      label: "The Chiropractic Resource Organization",
      url: "https://www.chiro.org/",
    },
    {
      label: "Chiropractic History Archive — Joseph C. Keating Jr, PhD",
      url: "https://www.chiro.org/Plus/History/",
    },
    {
      label: "Chiropractic treatments for back pain — Spine-health.com",
      url: "https://www.spine-health.com/topics/conserv/chiro/feature/chirtr01.html",
    },
    {
      label: "Dynamic Chiropractic Online — ChiroWeb",
      url: "https://www.chiroweb.com/dynamic",
    },
    {
      label: "National Directory of Chiropractic",
      url: "https://www.chirodirectory.com/",
    },
    {
      label: "Planet Chiropractic",
      url: "https://www.planetc1.com/",
    },
  ],
  aboutChiroTopics: [
    "What is Chiropractic",
    "History",
    "How it works",
    "What is Subluxation",
    "Spinal Degeneration",
  ],
} as const;

/* ------------------------------------------------------------------ */
/*  Q & A                                                              */
/* ------------------------------------------------------------------ */

export const SS_QA: readonly FaqEntry[] = [
  {
    q: "Is chiropractic effective?",
    a: "Chiropractic helps to remove postural imbalances and structural misalignments that can accumulate in our bodies over time. Chiropractic works by restoring your own inborn ability to be healthy. For your body to remain healthy, your nervous system must function well. For your nervous system to function well it must be free of interference. By restoring spinal function with chiropractic adjustments, nerve interference by misaligned vertebrae is removed, thus allowing optimal nervous system function and improved health.",
  },
  {
    q: "Why should I see a chiropractor?",
    a: "Seeing a chiropractor is not only for back pain and neck pain. Chiropractic care is an excellent way to keep your body at its peak performance through nutrition, adjustment and overall wellness. In addition, chiropractic care has been known to help a wide range of conditions from fibromyalgia to diabetes.",
  },
  {
    q: "What is subluxation?",
    a: "When a vertebrae becomes misaligned or moves out of its normal position, this is referred to in the chiropractic profession as a subluxation. Subluxations can be caused by a wide range of issues ranging from a minor slip or bump to a car accident or any sudden trauma. When a vertebrae is subluxated, it begins to put pressure on nerves, blood vessels and everything around it. This pressure comes with a price. The subluxation interrupts the natural pathways that the messages sent from the brain need to be clear in order to be completed properly.",
  },
  {
    q: "How does chiropractic care work?",
    a: "Chiropractic is an overall way of looking at the human body. It's based on the idea that the body is self-sustaining and self-healing. The body is in essence completely controlled by the brain through its connection via the spinal cord and the vast networks of nerves that make up the body. When this system is not functioning at its peak, the overall performance of the human body is lacking. While it's often perceived that the chiropractor is solely here to treat back and neck pain, this is simply a small piece of what the profession really is capable of handling. Chiropractors not only treat soft and hard tissue problems such as sciatica and joint pain, but are largely called on to deal with more significant issues. Some of these issues include fibromyalgia, allergies, insomnia, headaches and many more.",
  },
  {
    q: "What is a chiropractic adjustment? Is it safe?",
    a: "Adjustments, or manipulation as they're sometimes referred to, is the minor movement of vertebrae in the spine. The objective of this movement is to realign vertebrae that have moved out of place for a number of reasons ranging from normal daily activity to trauma such as a car accident. When these vertebrae are out of place, it has an overall systemic effect from muscular to the central nervous system. Without proper alignment and flow of all nerves and systems in the body from the brain, we can't function at our peak. An adjustment is often a pressure from the chiropractor utilizing the hands or an instrument to move a vertebrae back into place. This happens with a quick movement and is often without discomfort. You may hear a noise that sounds like you're cracking your knuckles referred to as joint cavitation. It is the release of gases such as oxygen and nitrogen from the joint.",
  },
  {
    q: "What can I expect from my visit to a chiropractor?",
    a: "Going to the chiropractor is a new experience for many of us. Maybe we've heard through a friend or have done some research online. It's possible that you are just fed up with living in pain and it's time to do something about it. In either case, your first visit to the chiropractor will really be about getting to know the chiropractor and discussing your history, current condition and goals.",
  },
  {
    q: "What results can I expect from treatment?",
    a: "Chiropractic is based on the idea of removing imbalances both structural and postural in an effort to allow our body to heal itself. For this to happen the network of nerves and signals from your brain, down your spinal cord, to the network of nerves must be allowed to flow freely without any interruption. Chiropractors have the ability and skill to remove these interruptions or misalignments and allow the body to perform as it was meant to. Allowing a chiropractor to get you back on track both chemically and structurally will bring your body back to the proper state it should be in to perform at its peak.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Navigation helpers                                                 */
/* ------------------------------------------------------------------ */

export const SS_SERVICE_NAV = SS_SERVICES.map((s) => ({
  href: `/sulphur-springs/${s.slug}`,
  label: s.title,
}));

export const SS_INJURY_NAV = SS_INJURIES.map((i) => ({
  href: `/sulphur-springs/${i.slug}`,
  label: i.title,
}));
