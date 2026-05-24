"use client";

import { createContext, useContext, type ReactNode } from "react";
import { publicBookingHref } from "@/lib/public-booking";

type PublicBookingContextValue = {
  enabled: boolean;
};

const PublicBookingContext = createContext<PublicBookingContextValue>({ enabled: true });

export function PublicBookingProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <PublicBookingContext.Provider value={{ enabled }}>{children}</PublicBookingContext.Provider>
  );
}

export function usePublicBookingEnabled(): boolean {
  return useContext(PublicBookingContext).enabled;
}

/** Link for schedule CTAs — always /book (wizard or call-to-confirm preview). */
export function useScheduleHref(query = ""): string {
  return publicBookingHref(query);
}
