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

/** Link for schedule CTAs: /book when on, /contact when off (phase 1 marketing). */
export function useScheduleHref(query = ""): string {
  const enabled = usePublicBookingEnabled();
  return enabled ? publicBookingHref(query) : "/contact";
}
