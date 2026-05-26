import type { LocationId, ServiceLine } from "./constants";

/** Which side of the practice the patient is associated with. */
export type PatientBusinessTag = "rub_club" | "chiro" | "both";

export const PATIENT_BUSINESS_LABELS: Record<PatientBusinessTag, string> = {
  rub_club: "Rub Club",
  chiro: "Chiro",
  both: "Both",
};

export function isPatientBusinessTag(v: unknown): v is PatientBusinessTag {
  return v === "rub_club" || v === "chiro" || v === "both";
}

/** Infer tag from a single booking’s location + service line. */
export function inferPatientBusinessFromBooking(
  locationId?: string,
  serviceLine?: string,
): "rub_club" | "chiro" {
  if (serviceLine === "massage" || serviceLine === "stretch") return "rub_club";
  if (serviceLine === "chiropractic") return "chiro";
  if (locationId === "sulphur_springs") return "chiro";
  return "rub_club";
}

export function mergePatientBusinessTag(
  current: PatientBusinessTag | undefined | null,
  inferred: "rub_club" | "chiro",
): PatientBusinessTag {
  if (!current) return inferred;
  if (current === "both") return "both";
  if (current === inferred) return current;
  return "both";
}

export function businessTagFromSchedulerBusiness(
  business: "rub_club" | "paris_chiro" | "sulphur_springs",
): PatientBusinessTag {
  if (business === "rub_club") return "rub_club";
  return "chiro";
}

export type SchedulerBookingMode = "bodywork" | "chiropractic";

export function schedulerDefaultsFromBusiness(
  business: "rub_club" | "paris_chiro" | "sulphur_springs",
  opts?: { schedulerMode?: SchedulerBookingMode },
): {
  locationId: LocationId;
  serviceLine: ServiceLine;
} {
  if (business === "sulphur_springs") {
    return {
      locationId: "sulphur_springs",
      serviceLine: opts?.schedulerMode === "bodywork" ? "massage" : "chiropractic",
    };
  }
  if (business === "paris_chiro") {
    return { locationId: "paris", serviceLine: "chiropractic" };
  }
  return { locationId: "paris", serviceLine: "massage" };
}

export function patientDisambiguatorLabel(opts: {
  name: string;
  locationId?: string;
  dateOfBirth?: string;
  phone?: string;
  businessTag?: PatientBusinessTag | null;
}): string {
  const parts: string[] = [];
  if (opts.businessTag) parts.push(PATIENT_BUSINESS_LABELS[opts.businessTag]);
  if (opts.locationId === "paris") parts.push("Paris");
  else if (opts.locationId === "sulphur_springs") parts.push("Sulphur Springs");
  if (opts.dateOfBirth?.trim()) parts.push(`DOB ${opts.dateOfBirth.trim()}`);
  else if (opts.phone?.trim()) {
    const d = opts.phone.replace(/\D/g, "").slice(-4);
    if (d) parts.push(`···${d}`);
  }
  if (parts.length === 0) return opts.name;
  return `${opts.name} (${parts.join(", ")})`;
}
