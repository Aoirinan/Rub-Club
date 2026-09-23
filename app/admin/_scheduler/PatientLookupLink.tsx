"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

/**
 * Hands a patient search (phone, email or name) to /admin/patient without
 * putting it in the URL: page URLs — including the RSC fetch behind a client
 * navigation — land in Vercel's request logs, and these are patient
 * identifiers. sessionStorage is per tab and is copied into a tab opened from
 * this one, so middle-click still works.
 */
const LOOKUP_KEY = "admin_patient_lookup_q";

export const PATIENT_LOOKUP_PATH = "/admin/patient";

export function stashPatientLookup(q: string): void {
  try {
    sessionStorage.setItem(LOOKUP_KEY, q);
  } catch {
    // Storage blocked: the lookup page just opens empty.
  }
}

/** Reads and clears a handed-off search; "" when there is none. */
export function takePatientLookup(): string {
  try {
    const q = sessionStorage.getItem(LOOKUP_KEY) ?? "";
    sessionStorage.removeItem(LOOKUP_KEY);
    return q;
  } catch {
    return "";
  }
}

export function PatientLookupLink({
  q,
  className,
  onClick,
  children,
}: {
  q: string;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={PATIENT_LOOKUP_PATH}
      className={className}
      // Middle-click opens a tab without a click event; mousedown comes first.
      onMouseDown={() => stashPatientLookup(q)}
      onClick={(e) => {
        stashPatientLookup(q);
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
