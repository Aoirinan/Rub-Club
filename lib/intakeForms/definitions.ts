/**
 * Version-controlled form field definitions for the online patient forms.
 *
 * Kept in code (not Firestore) so a bad edit can't break rendering. Editable
 * copy (intro/consent/terms/success/disabled) and the legal prose referenced by
 * `cmsKey` live in Firestore instead.
 *
 * All five forms are transcribed field-for-field from the live forms. Practice
 * details use Chiropractic Associates (Paris) / The Rub Club; doctor names are
 * Dr. Sean Welborn, DC; Dr. Greg Thompson, DC; Dr. Brandy Collins, DC.
 */

import type { IntakeFormDefinition, IntakeField } from "@/lib/intakeForms/types";

// 50 states + DC, two-letter postal codes.
export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
  "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const PAIN_TYPE_OPTIONS = [
  "Sharp", "Dull", "Throbbing", "Numbness", "Aching", "Shooting", "Burning",
  "Tingling", "Cramps", "Stiffness", "Swelling", "Other",
];

const INTERFERES_OPTIONS = ["Work", "Sleep", "Daily Routine", "Recreation"];

const PAINFUL_ACTIVITY_OPTIONS = [
  "Sitting", "Standing", "Walking", "Bending", "Lying down", "Other",
];

/** Shared "pain detail" tail used by the new-patient and vehicle-accident forms. */
function painDetailFields(): IntakeField[] {
  return [
    {
      id: "painDiagram",
      label: "Mark an X on the picture where you continue to have pain, numbness, or tingling.",
      type: "body-diagram",
    },
    {
      id: "painSeverity",
      label: "Rate the severity of your pain on a scale from 1 (least) to 10 (severe)",
      type: "scale-1-10",
    },
    { id: "painType", label: "Type of pain", type: "checkbox-group", options: PAIN_TYPE_OPTIONS },
    { id: "painFrequency", label: "How often do you have this pain?", type: "text" },
    { id: "painConstant", label: "Is it constant or does it come & go?", type: "text" },
    {
      id: "interferesWith",
      label: "Does this condition interfere with",
      type: "checkbox-group",
      options: INTERFERES_OPTIONS,
    },
    {
      id: "painfulActivities",
      label: "Activities or movements that are painful to perform",
      type: "checkbox-group",
      options: PAINFUL_ACTIVITY_OPTIONS,
    },
  ];
}

export const FORM_DEFINITIONS: IntakeFormDefinition[] = [];

const BY_SLUG: Record<string, IntakeFormDefinition> = {};

function register(def: IntakeFormDefinition) {
  FORM_DEFINITIONS.push(def);
  BY_SLUG[def.slug] = def;
}

export function getFormDefinition(slug: string): IntakeFormDefinition | null {
  return BY_SLUG[slug] ?? null;
}

/** Every field across a definition, flattened (used for validation/CSV). */
export function flattenFields(def: IntakeFormDefinition): IntakeField[] {
  return def.sections.flatMap((section) => section.fields);
}

// === FORM REGISTRATIONS (appended below) ===

// 1. New Patient Intake and Consents — 4 signature-blocks + 1 body-diagram.
register({
  slug: "new-patient-intake-and-consents",
  title: "New Patient Intake and Consents",
  brand: "chiropractic",
  sections: [
    {
      title: "Patient Information",
      fields: [
        { id: "date", label: "Date", type: "date", required: true, width: "half" },
        { id: "firstName", label: "First Name", type: "text", required: true, width: "half" },
        { id: "lastName", label: "Last Name", type: "text", required: true, width: "half" },
        { id: "streetAddress", label: "Street Address", type: "text", required: true },
        { id: "city", label: "City", type: "text", required: true, width: "half" },
        { id: "state", label: "State/Province", type: "select", options: US_STATES, width: "half" },
        { id: "zip", label: "Zip Code", type: "text", required: true, width: "quarter" },
        { id: "cellPhone", label: "Cell Phone", type: "tel", required: true, width: "half" },
        { id: "workPhone", label: "Work Phone", type: "tel", width: "half" },
        { id: "workExt", label: "Ext", type: "text", width: "quarter" },
        { id: "email", label: "Email", type: "email", required: true, width: "half" },
        { id: "bestTimePlace", label: "Best time and place to reach you", type: "text" },
        { id: "gender", label: "Gender", type: "radio", required: true, options: ["Female", "Male"] },
        { id: "age", label: "Age", type: "number", width: "quarter" },
        { id: "birthday", label: "Birthday", type: "date", required: true, width: "half" },
        {
          id: "maritalStatus",
          label: "Marital Status",
          type: "radio",
          required: true,
          options: ["Single", "Divorced", "Married", "Separated", "Widowed"],
        },
        {
          id: "servicesInterested",
          label: "What services are you interested in?",
          type: "checkbox-group",
          options: [
            "Chiropractic", "Prenatal Chiropractic", "Pediatric Chiropractic", "Massage Therapy",
            "Cupping", "Dry Needling", "Cold Laser Therapy", "Nutritional Consulting",
            "Fascial Stretch Therapy", "Spinal Decompression", "Essential Oil Counseling",
          ],
        },
        {
          id: "referredBy",
          label: "Whom may we thank for referring you to this office?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      title: "Accident Information",
      fields: [
        {
          id: "accidentDueTo",
          label: "Is this condition due to an accident?",
          type: "radio",
          options: ["Yes", "No"],
        },
        { id: "dateOfAccident", label: "Date of Accident", type: "date", width: "half", showWhen: { fieldId: "accidentDueTo", equals: "Yes" } },
        { id: "typeOfAccident", label: "Type of Accident", type: "radio", options: ["Auto", "Work", "Home", "Other"], showWhen: { fieldId: "accidentDueTo", equals: "Yes" } },
        { id: "adjusterName", label: "Adjuster's Name", type: "text", width: "half", showWhen: { fieldId: "accidentDueTo", equals: "Yes" } },
        { id: "adjusterPhone", label: "Adjuster's Phone #", type: "tel", width: "half", showWhen: { fieldId: "accidentDueTo", equals: "Yes" } },
        { id: "insuranceCompany", label: "Company name", type: "text", width: "half", showWhen: { fieldId: "accidentDueTo", equals: "Yes" } },
        { id: "claimNumber", label: "Claim Number", type: "text", width: "half", showWhen: { fieldId: "accidentDueTo", equals: "Yes" } },
      ],
    },
    {
      title: "Reason for this Visit",
      fields: [
        { id: "reasonForVisit", label: "Reason for visit:", type: "text", required: true },
        {
          id: "symptomsOnset",
          label: "When did your symptoms appear? What caused or contributed to your symptoms?",
          type: "textarea",
        },
        {
          id: "gettingWorse",
          label: "Is this condition getting progressively worse?",
          type: "radio",
          options: ["Yes", "No", "Unknown"],
        },
        {
          id: "triedToImprove",
          label: "What have you tried to make it better?",
          type: "checkbox-group",
          options: ["Ice", "Massage", "Stretching", "Heat", "PT", "Injections", "Nothing"],
          hasOtherText: true,
        },
        ...painDetailFields(),
      ],
    },
    {
      title: "Health History",
      fields: [
        {
          id: "treatmentReceived",
          label: "What treatment have you received for this condition?",
          type: "checkbox-group",
          options: ["Medications", "Surgery", "Physical Therapy", "Chiropractic", "None", "Other"],
          hasOtherText: true,
        },
        { id: "otherDoctors", label: "Name and address of other doctor(s) who have treated you", type: "textarea" },
        { id: "noteLastTwoYears", label: "Please confirm if you have had any of the following in the last two years:", type: "note" },
        { id: "examPhysical", label: "Physical Exam", type: "radio", options: ["Yes", "No"], width: "half" },
        { id: "examSpinal", label: "Spinal Exam", type: "radio", options: ["Yes", "No"], width: "half" },
        { id: "testBlood", label: "Blood Test", type: "radio", options: ["Yes", "No"], width: "half" },
        { id: "testUrine", label: "Urine Test", type: "radio", options: ["Yes", "No"], width: "half" },
        { id: "xraySpinal", label: "Spinal X-Ray", type: "radio", required: true, options: ["Yes", "No"], width: "half" },
        { id: "xrayChest", label: "Chest X-Ray", type: "radio", required: true, options: ["Yes", "No"], width: "half" },
        { id: "xrayDental", label: "Dental X-Ray", type: "radio", options: ["Yes", "No"], width: "half" },
        { id: "scanMri", label: "MRI/CT/Bone Scan", type: "radio", required: true, options: ["Yes", "No"], width: "half" },
        { id: "noteBringImaging", label: "If you indicated yes to any X-ray or MRI, please bring related CDs/imaging to your appointment.", type: "note" },
        {
          id: "conditionsHad",
          label: "Indicate if you have had any of the following",
          type: "checkbox-group",
          options: [
            "AIDS/HIV", "Alcoholism", "Allergy Shots", "Anemia", "Asthma", "Bleeding Disorder",
            "Breast Lump", "Cancer", "Chemical Dependency", "Chicken Pox", "Diabetes", "Emphysema",
            "Epilepsy", "Food Intolerances", "Glaucoma", "Goiter", "Gout", "Heart Disease",
            "Herniated Disk", "Hernia", "High Cholesterol", "Kidney Disease", "Liver Disease",
            "Migraine Headaches", "Miscarriage", "Mononucleosis", "Multiple Sclerosis",
            "Osteoporosis", "Pacemaker", "Parkinson's Disease", "Pinched Nerve", "Pneumonia",
            "Polio", "Prostate Problems", "Prosthesis", "Psychiatric care", "Rheumatoid arthritis",
            "Rheumatic fever", "Scarlet fever", "Stroke", "Thyroid problems", "Tonsilitis",
            "Tuberculosis", "Tumors/growths", "Typhoid fever", "Ulcer", "Other",
          ],
        },
        { id: "pregnant", label: "Are you pregnant?", type: "radio", options: ["Yes", "No"], width: "half" },
        { id: "dueDate", label: "Due Date", type: "date", width: "half", showWhen: { fieldId: "pregnant", equals: "Yes" } },
        { id: "lmp", label: "LMP", type: "date", width: "half", showWhen: { fieldId: "pregnant", equals: "Yes" } },
        { id: "exercise", label: "Exercise", type: "radio", options: ["None", "Moderate", "Daily", "Heavy"] },
        { id: "workActivity", label: "Work Activity", type: "radio", options: ["Sitting", "Standing", "Light Labor", "Heavy Labor"] },
        {
          id: "habits",
          label: "Habits",
          type: "checkbox-group",
          options: ["Smoking", "Alcohol", "Coffee/Caffeine Drinks", "High Stress Level"],
        },
        { id: "packsPerDay", label: "Packs/day", type: "text", width: "quarter" },
        { id: "drinksPerWeek", label: "Drinks/week", type: "text", width: "quarter" },
        { id: "cupsPerDay", label: "Cups/Day", type: "text", width: "quarter" },
        { id: "reasonForStress", label: "Reason for stress?", type: "text", width: "quarter" },
        { id: "notePastInjuries", label: "Past injuries and surgeries (description and date)", type: "note" },
        { id: "injFalls", label: "Falls", type: "text", width: "half" },
        { id: "injHead", label: "Head Injuries", type: "text", width: "half" },
        { id: "injBrokenBones", label: "Broken Bones", type: "text", width: "half" },
        { id: "injDislocations", label: "Dislocations", type: "text", width: "half" },
        { id: "injSurgeries", label: "Surgeries", type: "text", width: "half" },
        { id: "injOther", label: "Other", type: "text", width: "half" },
        { id: "medications", label: "Medications", type: "textarea" },
        { id: "allergies", label: "Allergies", type: "textarea" },
        { id: "vitamins", label: "Vitamins/Herbs/Minerals", type: "textarea" },
      ],
    },
    {
      title: "In Case of Emergency Contact",
      fields: [
        { id: "emergencyName", label: "Name:", type: "text", required: true, width: "half" },
        { id: "emergencyRelationship", label: "Relationship", type: "text", width: "half" },
        { id: "emergencyHomePhone", label: "Home Phone", type: "tel", required: true, width: "half" },
        { id: "emergencyWorkPhone", label: "Work Phone", type: "tel", width: "half" },
      ],
    },
    {
      title: "Cancellation Policy",
      fields: [
        { id: "legalCancellation", label: "Cancellation Policy", type: "legal-text", cmsKey: "cancellation_policy" },
        { id: "ackCancellation24h", label: "I acknowledge the 24-hour cancellation notice policy.", type: "checkbox", required: true },
        { id: "ackCancellationCharge", label: "I acknowledge that repeated cancellations may result in a charge.", type: "checkbox", required: true },
        { id: "sigCancellation", label: "Signature", type: "signature-block", includePrintedName: true, includeEmail: true, includeDate: true },
        { id: "preferredReminder", label: "Preferred reminder", type: "radio", options: ["Cell", "Email"] },
      ],
    },
    {
      title: "Informed Consent to Chiropractic Treatment",
      fields: [
        { id: "legalInformedConsent", label: "Informed Consent to Chiropractic Treatment", type: "legal-text", cmsKey: "informed_consent" },
        { id: "legalTpo", label: "Consent for Treatment, Payment & Healthcare Operations", type: "legal-text", cmsKey: "tpo_consent" },
        { id: "noteDoNotSign1", label: "DO NOT SIGN UNTIL YOU HAVE READ AND UNDERSTAND THE ABOVE", type: "note" },
        { id: "sigInformedConsent", label: "Signature", type: "signature-block", includePrintedName: true, includeEmail: true, includeDate: true },
      ],
    },
    {
      title: "Confidential Communication Request (HIPAA)",
      fields: [
        { id: "legalConfidentialComm", label: "Confidential Communication Request", type: "legal-text", cmsKey: "confidential_comm" },
        { id: "confidentialConsent", label: "Please select one of the following:", type: "radio", required: true, options: ["I DO consent", "I DO NOT consent"] },
        {
          id: "confidentialBest",
          label: "If I DO CONSENT, the following way is best",
          type: "checkbox-group",
          options: ["Home phone answering machine", "Cell/mobile voicemail", "Email", "My spouse [name]", "Other [name]"],
          hasOtherText: true,
          showWhen: { fieldId: "confidentialConsent", equals: "I DO consent" },
        },
        { id: "sigConfidentialComm", label: "Signature", type: "signature-block", includePrintedName: false, includeEmail: false, includeDate: false },
      ],
    },
    {
      title: "Notice of Privacy Practices",
      fields: [
        { id: "legalNpp", label: "Notice of Privacy Practices", type: "legal-text", cmsKey: "notice_privacy_practices" },
        { id: "noteNppAck", label: "Acknowledgement of Receipt of Notice of Privacy Practices", type: "note" },
        { id: "sigNpp", label: "Signature", type: "signature-block", includePrintedName: true, includeEmail: true, includeDate: true },
      ],
    },
  ],
});
// 2. Massage Therapy Intake (The Rub Club) — type-your-name consents, no signature pad.
register({
  slug: "massage-intake-form",
  title: "Massage Therapy Intake",
  brand: "rub_club",
  sections: [
    {
      title: "Contact",
      fields: [
        { id: "firstName", label: "First Name", type: "text", required: true, width: "half" },
        { id: "lastName", label: "Last Name", type: "text", required: true, width: "half" },
        { id: "email", label: "Email", type: "email", required: true, width: "half" },
        { id: "date", label: "Date", type: "date", required: true, width: "half" },
        { id: "phone", label: "Phone", type: "tel", required: true, width: "half" },
        { id: "birthday", label: "Birthday", type: "date", required: true, width: "half" },
        { id: "address", label: "Address", type: "text", required: true },
        { id: "city", label: "City", type: "text", required: true, width: "half" },
        { id: "state", label: "State/Province", type: "select", required: true, options: US_STATES, width: "half" },
        { id: "zip", label: "Zip Code", type: "text", required: true, width: "quarter" },
        { id: "occupation", label: "Occupation", type: "text", required: true, width: "half" },
        { id: "emergencyFirstName", label: "Emergency Contact First Name", type: "text", required: true, width: "half" },
        { id: "emergencyLastName", label: "Emergency Contact Last Name", type: "text", required: true, width: "half" },
        { id: "emergencyPhone", label: "Emergency Contact Phone Number", type: "tel", required: true, width: "half" },
        { id: "howHeard", label: "How did you hear about us?", type: "text", required: true },
      ],
    },
    {
      title: "Massage and Health History",
      fields: [
        { id: "noteHistory", label: "The following information will be used to help plan safe and effective massage sessions. Please answer to the best of your knowledge.", type: "note" },
        { id: "hadMassageBefore", label: "Have you had a professional massage before?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "massageFrequency", label: "If yes, how often?", type: "text", showWhen: { fieldId: "hadMassageBefore", equals: "Yes" } },
        { id: "difficultyLying", label: "Do you have any difficulty lying on your front, back, or side?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "difficultyLyingExplain", label: "If yes, please explain", type: "text", showWhen: { fieldId: "difficultyLying", equals: "Yes" } },
        { id: "sensitiveSkin", label: "Do you have sensitive skin?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "allergiesLotions", label: "Do you have any allergies to lotions, oils, or ointments?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "allergiesLotionsExplain", label: "If yes, please explain", type: "text", showWhen: { fieldId: "allergiesLotions", equals: "Yes" } },
        { id: "wearing", label: "Are you wearing contact lenses, dentures, or hearing aid(s)?", type: "checkbox-group", required: true, options: ["Contact Lenses", "Dentures", "Hearing aid(s)", "None"] },
        { id: "sitLongHours", label: "Do you sit for long hours at a workstation, computer, or driving?", type: "radio", required: true, options: ["Yes", "No", "Maybe"] },
        { id: "repetitiveMovements", label: "What repetitive movements do you perform in daily work, sports, or hobbies?", type: "text" },
        { id: "experienceStress", label: "Do you experience stress in your work, family, or other aspects of your life?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "indicateFollowing", label: "Please indicate if you have any of the following", type: "checkbox-group", options: ["Muscle Tension", "Anxiety", "Insomnia", "Irritability"], hasOtherText: true },
        { id: "focusArea", label: "Which area of the body are you experiencing tension/stiffness/pain and would like the therapist to focus on?", type: "text", required: true },
        { id: "goals", label: "Your goals for this massage session:", type: "text", required: true },
      ],
    },
    {
      title: "Medical History",
      fields: [
        { id: "noteMedical", label: "We need some general information about your medical history.", type: "note" },
        { id: "underMedicalSupervision", label: "Are you currently under medical supervision? If yes, please explain:", type: "text", required: true },
        { id: "seeChiropractor", label: "Do you see a Chiropractor?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "chiroFrequency", label: "If yes, how often?", type: "text", showWhen: { fieldId: "seeChiropractor", equals: "Yes" } },
        { id: "currentMedications", label: "Please list any current medications you are taking", type: "text", required: true },
        {
          id: "conditionsApply",
          label: "Please check any condition below that applies to you:",
          type: "checkbox-group",
          required: true,
          options: [
            "Contagious skin condition", "Open sores or wounds", "Easy bruising",
            "Recent accident or injury", "Recent surgery", "Artificial joint", "Sprains/strains",
            "Current fever", "Swollen glands", "Allergies/sensitivity", "Heart condition",
            "High or low blood pressure", "Circulatory disorder", "Varicose veins",
            "Atherosclerosis", "Phlebitis", "Deep vein thrombosis/blood clots",
            "Joint disorder / rheumatoid arthritis / osteoarthritis / tendonitis", "Osteoporosis",
            "Epilepsy", "Headaches/migraines", "Cancer", "Diabetes", "Decreased sensation",
            "Fibromyalgia", "TMJ disorder", "Carpal tunnel syndrome", "Tennis elbow", "None",
          ],
          hasOtherText: true,
        },
        { id: "conditionsExplain", label: "Please explain any condition you marked above:", type: "text", required: true },
        { id: "pregnant", label: "Are you pregnant?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "pregnantWeeks", label: "If pregnant, how many weeks?", type: "text", showWhen: { fieldId: "pregnant", equals: "Yes" } },
        { id: "anythingElse", label: "Anything else about your health history useful for your massage practitioner to know?", type: "textarea" },
      ],
    },
    {
      title: "Acknowledgment",
      fields: [
        { id: "legalMassageConsent", label: "Massage Therapy Acknowledgment", type: "legal-text", cmsKey: "massage_consent" },
        { id: "typeNameAck", label: "Type your full legal name below to acknowledge and consent.", type: "text", required: true },
        { id: "noteDraping", label: "Draping will be used during the session — only the area being worked on will be uncovered. Clients under 18 must have their legal guardian sign a consent-to-treat-a-minor form prior to the session.", type: "note" },
      ],
    },
    {
      title: "Cancellation Policy",
      fields: [
        { id: "legalCancellation", label: "Cancellation Policy", type: "legal-text", cmsKey: "massage_cancellation_policy" },
        { id: "typeNameCancellation", label: "Please type your name below to consent that you have read, agree with, and understand the Cancellation Policy", type: "text", required: true },
      ],
    },
  ],
});
// 3. Vehicle Accident Information — 1 signature-block + 1 body-diagram.
register({
  slug: "vehicle-accident-form",
  title: "Vehicle Accident Information",
  brand: "chiropractic",
  sections: [
    {
      title: "Patient Information",
      fields: [
        { id: "date", label: "Date", type: "date", width: "half" },
        { id: "firstName", label: "First Name", type: "text", required: true, width: "half" },
        { id: "lastName", label: "Last Name", type: "text", required: true, width: "half" },
        { id: "dateOfAccident", label: "Date of Accident", type: "date", width: "half" },
        { id: "timeOfAccident", label: "Time of Accident (include AM/PM)", type: "text", width: "half" },
        { id: "describeAccident", label: "Please describe the accident in your own words", type: "textarea" },
        { id: "wereYouThe", label: "Were you the:", type: "radio", options: ["Driver", "Rear Passenger", "Front Passenger", "Pedestrian"] },
        { id: "peopleInAccident", label: "How many people were in the accident?", type: "number", width: "half" },
      ],
    },
    {
      title: "Accident Site",
      fields: [
        { id: "roadName", label: "Road/Street Name", type: "text" },
        { id: "city", label: "City", type: "text", required: true, width: "half" },
        { id: "state", label: "State/Province", type: "select", options: US_STATES, width: "half" },
        { id: "nearestIntersection", label: "Nearest intersection", type: "text" },
        { id: "drivingConditions", label: "Driving Conditions", type: "radio", options: ["Dry", "Wet", "Icy", "Other"] },
        { id: "directionHeaded", label: "Which direction were you headed?", type: "text", width: "half" },
        { id: "speedTravelling", label: "Speed you were travelling?", type: "text", width: "half" },
      ],
    },
    {
      title: "Vehicle",
      fields: [
        { id: "makeModel", label: "Make and model of vehicle you were in", type: "text" },
        { id: "seatbelt", label: "Were you wearing a seatbelt?", type: "radio", options: ["Yes", "No"] },
        { id: "seatbeltType", label: "If yes, what type?", type: "text", showWhen: { fieldId: "seatbelt", equals: "Yes" } },
        { id: "airbags", label: "Was vehicle equipped with airbags?", type: "radio", options: ["Yes", "No"] },
        { id: "airbagsInflate", label: "If yes, did it/they inflate properly?", type: "radio", options: ["Yes", "No"], showWhen: { fieldId: "airbags", equals: "Yes" } },
        { id: "headrest", label: "Did your seat have a headrest?", type: "radio", options: ["Yes", "No"] },
        { id: "headrestPosition", label: "If yes, position of headrest", type: "radio", options: ["Low", "Midposition", "High"], showWhen: { fieldId: "headrest", equals: "Yes" } },
      ],
    },
    {
      title: "Other Vehicle",
      fields: [
        { id: "otherMakeModel", label: "Make and model of other vehicle", type: "text" },
        { id: "otherDirection", label: "Which direction was other vehicle headed?", type: "text", width: "half" },
        { id: "otherSpeed", label: "Speed other vehicle was travelling", type: "text", width: "half" },
      ],
    },
    {
      title: "Impact",
      fields: [
        { id: "impactVehicle", label: "Did your car impact another vehicle?", type: "radio", options: ["Yes", "No"] },
        { id: "impactStructure", label: "Did your car impact a structure?", type: "radio", options: ["Yes", "No"] },
        { id: "impactStructureExplain", label: "If yes, explain", type: "text", showWhen: { fieldId: "impactStructure", equals: "Yes" } },
        { id: "bodyStrike", label: "Did any part of your body strike anything in the vehicle?", type: "radio", options: ["Yes", "No"] },
        { id: "bodyStrikeExplain", label: "If yes, explain", type: "text", showWhen: { fieldId: "bodyStrike", equals: "Yes" } },
        { id: "impactFrom", label: "Was impact from:", type: "radio", options: ["Front", "Rear", "Left", "Right", "Other"] },
        { id: "atTimeOfImpact", label: "At the time of impact were you:", type: "radio", options: ["Looking straight ahead", "Looking to the left", "Looking up", "Looking to the right", "Looking down"] },
        { id: "bothHands", label: "Were both hands on the steering wheel?", type: "radio", options: ["Yes", "No"] },
        { id: "whichHand", label: "If no, which hand", type: "radio", options: ["Right", "Left"], showWhen: { fieldId: "bothHands", equals: "No" } },
        { id: "footOnBrake", label: "Was your foot on the brake?", type: "radio", options: ["Yes", "No"] },
        { id: "whichFoot", label: "If yes, which foot", type: "radio", options: ["Right", "Left"], showWhen: { fieldId: "footOnBrake", equals: "Yes" } },
        { id: "surprisedBraced", label: "Were you:", type: "radio", options: ["Surprised by impact", "Braced for impact"] },
      ],
    },
    {
      title: "Police",
      fields: [
        { id: "policeCame", label: "Did the police come to the accident site?", type: "radio", options: ["Yes", "No"] },
        { id: "witnesses", label: "Were there any witnesses?", type: "radio", options: ["Yes", "No"] },
        { id: "policeReport", label: "Was a police report filed?", type: "radio", options: ["Yes", "No"] },
        { id: "trafficViolation", label: "Was a traffic violation issued?", type: "radio", options: ["Yes", "No"] },
        { id: "violationToWhom", label: "If yes, to whom?", type: "text", showWhen: { fieldId: "trafficViolation", equals: "Yes" } },
      ],
    },
    {
      title: "Patient Condition",
      fields: [
        { id: "unconscious", label: "Were you unconscious immediately after the accident?", type: "radio", options: ["Yes", "No"] },
        { id: "unconsciousHowLong", label: "If yes, for how long?", type: "text", showWhen: { fieldId: "unconscious", equals: "Yes" } },
        { id: "feltAfter", label: "Please describe how you felt immediately after the accident", type: "textarea" },
      ],
    },
    {
      title: "Treatment",
      fields: [
        { id: "wentHospital", label: "Did you go to the hospital?", type: "radio", options: ["Yes", "No"] },
        { id: "whenGo", label: "When did you go?", type: "radio", options: ["Immediately after accident", "Next Day", "2 days or more after the accident"], showWhen: { fieldId: "wentHospital", equals: "Yes" } },
        { id: "howGetHospital", label: "How did you get to the hospital?", type: "radio", options: ["Ambulance", "Private transportation"], showWhen: { fieldId: "wentHospital", equals: "Yes" } },
        { id: "hospitalName", label: "Name of hospital", type: "text", width: "half" },
        { id: "doctorName", label: "Name of doctor", type: "text", width: "half" },
        { id: "diagnosis", label: "Diagnosis", type: "text" },
        { id: "treatmentReceived", label: "Treatment received", type: "text" },
        { id: "xraysTaken", label: "X-rays taken", type: "text" },
      ],
    },
    {
      title: "Symptoms/Injuries",
      fields: [
        { id: "ableToWork", label: "Have you been able to work since this injury?", type: "radio", options: ["Yes", "No"] },
        { id: "workDaysMissed", label: "How many work days have you missed?", type: "number", width: "half" },
        { id: "priorEqualBasis", label: "Prior to the injury were you able to work on an equal basis with others your age?", type: "radio", options: ["Yes", "No"] },
        {
          id: "symptomsSince",
          label: "Symptoms since your injury",
          type: "checkbox-group",
          options: [
            "Arm/shoulder pain", "Back pain", "Back stiffness", "Chest pain", "Dizziness",
            "Ear buzzing", "Ear ringing", "Fatigue", "Feet/toe numbness", "Hand/finger numbness",
            "Headaches", "Irritability", "Jaw problems", "Leg pain", "Memory loss", "Nausea",
            "Neck pain", "Neck stiff", "Shortness of breath", "Sleep difficulty", "Stomach upset",
            "Tension", "Vision blurred",
          ],
        },
        { id: "gettingWorse", label: "Is this condition getting progressively worse?", type: "radio", options: ["Yes", "No", "Unsure"] },
        ...painDetailFields(),
      ],
    },
    {
      title: "Attestation",
      fields: [
        { id: "noteAttestation", label: "To the best of my knowledge, the above information is complete and correct. I understand that it is my responsibility to inform my doctor if I, or my minor child, ever have a change in health.", type: "note" },
        { id: "sigAttestation", label: "Signature", type: "signature-block", includePrintedName: true, includeEmail: true, includeDate: true },
        { id: "relationshipToPatient", label: "Relationship to patient (if other than patient)", type: "text" },
      ],
    },
  ],
});
// 4. Consent Only — one drawn signature, one checkbox, three type-your-name consents.
register({
  slug: "consent-only-form",
  title: "Consent Only",
  brand: "chiropractic",
  sections: [
    {
      title: "Contact",
      fields: [
        { id: "firstName", label: "First Name", type: "text", required: true, width: "half" },
        { id: "lastName", label: "Last Name", type: "text", required: true, width: "half" },
        { id: "email", label: "Email", type: "email", required: true, width: "half" },
        { id: "phone", label: "Phone Number", type: "tel", required: true, width: "half" },
        { id: "address", label: "Address", type: "text", required: true },
      ],
    },
    {
      title: "Informed Consent to Chiropractic Treatment",
      fields: [
        { id: "legalInformedConsent", label: "Informed Consent to Chiropractic Treatment", type: "legal-text", cmsKey: "informed_consent" },
        { id: "legalTpo", label: "Consent for Treatment, Payment & Healthcare Operations", type: "legal-text", cmsKey: "tpo_consent" },
        { id: "sigInformedConsent", label: "Signature", type: "signature-block", includePrintedName: true, includeEmail: true, includeDate: true },
      ],
    },
    {
      title: "HIPAA Acknowledgement",
      fields: [
        { id: "legalConfidentialComm", label: "Confidential Communication Request", type: "legal-text", cmsKey: "confidential_comm" },
        {
          id: "leaveMessages",
          label: "Tell us whether/with whom we may leave messages",
          type: "checkbox-group",
          options: ["My home answering machine", "My cell or mobile voicemail", "My email", "My spouse/partner or my emergency contact"],
        },
      ],
    },
    {
      title: "Notice of Privacy Practices",
      fields: [
        { id: "legalNpp", label: "Notice of Privacy Practices", type: "legal-text", cmsKey: "notice_privacy_practices" },
        {
          id: "ackNpp",
          label: "I have read, agree with, and understand the above statements and consent to evaluation and treatment under these terms. By checking the box I understand I am signing this form electronically and that this is a legally binding signature.",
          type: "checkbox",
          required: true,
        },
        { id: "typeNameNpp", label: "Consent, Privacy Policy, and HIPAA — please type your name below to consent", type: "text", required: true },
      ],
    },
    {
      title: "Cancellation Policy",
      fields: [
        { id: "legalCancellation", label: "Cancellation Policy", type: "legal-text", cmsKey: "cancellation_policy" },
        { id: "typeNameCancellation", label: "Please type your FULL LEGAL NAME to consent to the Cancellation Policy", type: "text", required: true },
      ],
    },
    {
      title: "Final Attestation",
      fields: [
        { id: "typeNameFinal", label: "Please type your FULL LEGAL NAME to consent that you have read, agree with, and understand the above statements. By typing your name you understand you are signing electronically and this is legally binding.", type: "text", required: true },
      ],
    },
  ],
});
// 5. Pediatric History Form — 4 signature-blocks, no body-diagram.
register({
  slug: "pediatric-intake",
  title: "Pediatric History Form",
  brand: "chiropractic",
  sections: [
    {
      title: "Welcome",
      fields: [
        { id: "legalPediatricWelcome", label: "Welcome", type: "legal-text", cmsKey: "pediatric_welcome" },
      ],
    },
    {
      title: "Child Information",
      fields: [
        { id: "childFirstName", label: "Child's First Name", type: "text", required: true, width: "half" },
        { id: "childLastName", label: "Child's Last Name", type: "text", required: true, width: "half" },
        { id: "birthday", label: "Birthday", type: "date", required: true, width: "half" },
        { id: "dueDate", label: "Due Date", type: "date", width: "half" },
        { id: "birthWeight", label: "Birth Weight", type: "text", required: true, width: "half" },
        { id: "currentHeight", label: "Current Height", type: "text", required: true, width: "half" },
        { id: "currentWeight", label: "Current Weight", type: "text", width: "half" },
        { id: "age", label: "Age", type: "number", required: true, width: "quarter" },
        { id: "streetAddress", label: "Street Address", type: "text", required: true },
        { id: "city", label: "City", type: "text", required: true, width: "half" },
        { id: "state", label: "State/Province", type: "select", required: true, options: US_STATES, width: "half" },
        { id: "zip", label: "Zip Code", type: "text", required: true, width: "quarter" },
        { id: "phone", label: "Phone", type: "tel", required: true, width: "half" },
        { id: "mothersCell", label: "Mother's Cell", type: "tel", required: true, width: "half" },
        { id: "fathersCell", label: "Father's Cell", type: "tel", required: true, width: "half" },
        { id: "purposeOfVisit", label: "Purpose of this visit:", type: "radio", required: true, options: ["Wellness Check-up", "Injury or Accident", "Other"] },
        { id: "mothersDob", label: "Mother's DOB", type: "date", required: true, width: "half" },
        { id: "fathersDob", label: "Father's DOB", type: "date", required: true, width: "half" },
      ],
    },
    {
      title: "Child's Current Problem",
      fields: [
        { id: "currentProblem", label: "Child's Current Problem", type: "text" },
        { id: "painLocation", label: "If your child is experiencing pain/discomfort, identify where and for how long", type: "text" },
        { id: "problemBegan", label: "When did this problem begin?", type: "text" },
        { id: "occurredBefore", label: "Has this problem occurred before?", type: "radio", options: ["Yes", "No"] },
        { id: "occurredBeforeWhen", label: "If yes, when?", type: "text", showWhen: { fieldId: "occurredBefore", equals: "Yes" } },
        { id: "bowelBladder", label: "Any bowel or bladder problems since this problem began?", type: "radio", options: ["No", "Yes"] },
        { id: "bowelBladderExplain", label: "If yes, please explain", type: "text", showWhen: { fieldId: "bowelBladder", equals: "Yes" } },
        { id: "seenOtherDoctors", label: "Have you seen other doctors for this problem?", type: "radio", options: ["No", "Yes"] },
        { id: "otherDoctorName", label: "Doctor's Name", type: "text", showWhen: { fieldId: "seenOtherDoctors", equals: "Yes" } },
        { id: "otherDoctorLastVisit", label: "Approximate date of last visit", type: "text", showWhen: { fieldId: "seenOtherDoctors", equals: "Yes" } },
        { id: "otherDoctorResults", label: "Results", type: "text", showWhen: { fieldId: "seenOtherDoctors", equals: "Yes" } },
        { id: "problemNow", label: "How is this problem NOW?", type: "radio", options: ["Rapidly Improving", "Improving Slowly", "About the Same", "Gradually Worsening", "On & Off"], helpText: "Verify the first option against the live form before launch." },
        { id: "medicationForProblem", label: "Please list any medication taken for this problem", type: "text" },
        { id: "sportsInjury", label: "Has your child ever sustained an injury playing organized sports?", type: "radio", required: true, options: ["No", "Yes"] },
        { id: "sportsInjuryExplain", label: "If yes, please explain", type: "text", showWhen: { fieldId: "sportsInjury", equals: "Yes" } },
        { id: "autoAccidentInjury", label: "Has your child ever sustained an injury in an auto accident?", type: "radio", required: true, options: ["No", "Yes"] },
        { id: "autoAccidentExplain", label: "If yes, please explain", type: "text", showWhen: { fieldId: "autoAccidentInjury", equals: "Yes" } },
        {
          id: "childSufferedFrom",
          label: "Has your child ever suffered from",
          type: "checkbox-group",
          options: [
            "Headaches", "Dizziness", "Fainting", "Seizures/Convulsions", "Heart Trouble",
            "Chronic Earaches", "Poor Posture", "Behavioral Problems", "Fall in Baby Walker",
            "Sleeping Problems", "Fall from High Chair", "Orthopedic Problems", "Neck Problems",
            "Arm Problems", "Leg Problems", "Joint Problems", "Backaches", "Hypertension",
            "Colds/Flu", "Fall from Bed or Couch", "Broken Bones", "Fall Off Slide",
            "Digestive Disorders", "Poor Appetite", "Stomach Aches", "Ruptures/Hernia",
            "Constipation", "Diarrhea", "Asthma", "Walking Trouble", "Fall from Crib", "Colic",
            "Fall from Changing Table", "Anemia", "ADD/ADHD", "Reflux", "Muscle Pain",
            "Growing Pains", "Sinus Trouble", "Scoliosis", "Bed Wetting", "Fall Off Swing",
            "Fall Off Bicycle", "Fall Off Monkey Bars",
          ],
          hasOtherText: true,
        },
        { id: "allergiesTo", label: "Allergies to", type: "text" },
      ],
    },
    {
      title: "Cancellation Policy",
      fields: [
        { id: "legalCancellation", label: "Cancellation Policy", type: "legal-text", cmsKey: "cancellation_policy" },
        { id: "sigCancellation", label: "Signature", type: "signature-block", includePrintedName: true, includeEmail: true, includeDate: true },
      ],
    },
    {
      title: "Informed Consent for Chiropractic Treatment",
      fields: [
        { id: "legalPediatricInformedConsent", label: "Informed Consent for Chiropractic Treatment", type: "legal-text", cmsKey: "pediatric_informed_consent" },
        { id: "legalTpo", label: "Consent for Treatment, Payment & Healthcare Operations", type: "legal-text", cmsKey: "tpo_consent" },
        { id: "noteDoNotSign", label: "DO NOT SIGN UNTIL YOU HAVE READ AND UNDERSTAND THE ABOVE", type: "note" },
        { id: "sigInformedConsent", label: "Signature", type: "signature-block", includePrintedName: true, includeEmail: true, includeDate: true },
      ],
    },
    {
      title: "Confidential Communication Request (HIPAA)",
      fields: [
        { id: "legalConfidentialComm", label: "Confidential Communication Request", type: "legal-text", cmsKey: "confidential_comm" },
        { id: "confidentialConsent", label: "Please select one of the following:", type: "radio", required: true, options: ["I DO consent", "I DO NOT consent"] },
        {
          id: "confidentialBest",
          label: "If I DO CONSENT, the following way is best",
          type: "checkbox-group",
          options: ["Home phone answering machine", "Cell/mobile voicemail", "Email", "My spouse [name]", "Other [name]"],
          hasOtherText: true,
          showWhen: { fieldId: "confidentialConsent", equals: "I DO consent" },
        },
        { id: "sigConfidentialComm", label: "Signature", type: "signature-block", includePrintedName: false, includeEmail: false, includeDate: false },
      ],
    },
    {
      title: "Notice of Privacy Practices",
      fields: [
        { id: "legalNpp", label: "Notice of Privacy Practices", type: "legal-text", cmsKey: "notice_privacy_practices" },
        { id: "noteNppAck", label: "Acknowledgement of Receipt of Notice of Privacy Practices", type: "note" },
        { id: "sigNpp", label: "Signature", type: "signature-block", includePrintedName: true, includeEmail: true, includeDate: true },
      ],
    },
  ],
});
