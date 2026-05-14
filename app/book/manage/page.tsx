import type { Metadata } from "next";
import ManageBookingClient from "./ManageBookingClient";

export const metadata: Metadata = {
  title: "Manage appointment",
  description: "Cancel or reschedule a confirmed appointment using your secure link.",
  robots: { index: false, follow: false },
};

type SearchParams = { token?: string };

export default async function ManageBookingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return <ManageBookingClient initialToken={token} />;
}
