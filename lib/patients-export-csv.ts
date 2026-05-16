import { DateTime } from "luxon";
import { TIME_ZONE } from "@/lib/constants";
import type { PatientDoc } from "@/lib/patients-db";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function tsChicago(ts: { toMillis: () => number } | null | undefined): string {
  if (!ts) return "";
  return DateTime.fromMillis(ts.toMillis(), { zone: TIME_ZONE }).toFormat("yyyy-LL-dd");
}

export function buildPatientsExportCsv(patients: PatientDoc[]): string {
  const headers = [
    "First Name",
    "Last Name",
    "Phone",
    "Email",
    "Date of Birth",
    "Address",
    "City",
    "State",
    "Zip",
    "Payment Type",
    "Insurance Carrier",
    "Total Visits",
    "Total Canceled",
    "Total No Shows",
    "Last Visit Date",
    "Next Appointment",
    "Notes",
    "Created Date",
  ];

  const lines = [headers.map(escapeCsvCell).join(",")];

  for (const p of patients) {
    lines.push(
      [
        p.firstName,
        p.lastName,
        p.phone,
        p.email,
        p.dateOfBirth ?? "",
        p.address ?? "",
        p.city ?? "",
        p.state ?? "",
        p.zip ?? "",
        p.paymentType,
        p.insuranceCarrier ?? "",
        String(p.totalVisits),
        String(p.totalCanceled),
        String(p.totalNoShow),
        tsChicago(p.lastVisitDate),
        tsChicago(p.nextAppointmentDate),
        p.notes ?? "",
        tsChicago(p.createdAt),
      ]
        .map((c) => escapeCsvCell(c))
        .join(","),
    );
  }

  return lines.join("\r\n");
}

export const PATIENT_CSV_TEMPLATE = [
  "First Name,Last Name,Phone,Email,Date of Birth,Address,City,State,Zip,Payment Type,Insurance Carrier,Notes",
  "Jane,Doe,903-555-0100,jane@example.com,01/15/1985,123 Main St,Paris,TX,75460,cash,,",
].join("\r\n");
