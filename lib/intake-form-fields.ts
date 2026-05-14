export const INTAKE_TEXT_FIELDS = [
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

export type IntakeTextFieldKey = (typeof INTAKE_TEXT_FIELDS)[number];

export const INTAKE_BOOLEAN_FIELDS = ["pregnant", "pacemaker"] as const;
