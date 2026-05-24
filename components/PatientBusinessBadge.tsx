import { PATIENT_BUSINESS_LABELS, type PatientBusinessTag } from "@/lib/patient-business";

const BADGE_CLASSES: Record<PatientBusinessTag, string> = {
  rub_club: "bg-teal-100 text-teal-900 ring-teal-200",
  chiro: "bg-slate-200 text-slate-900 ring-slate-300",
  both: "bg-amber-100 text-amber-950 ring-amber-200",
};

export function PatientBusinessBadge({
  tag,
  className = "",
}: {
  tag: PatientBusinessTag | null | undefined;
  className?: string;
}) {
  if (!tag) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${BADGE_CLASSES[tag]} ${className}`}
    >
      {PATIENT_BUSINESS_LABELS[tag]}
    </span>
  );
}
