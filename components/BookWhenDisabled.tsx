import Link from "next/link";
import type { LocationInfo } from "@/lib/constants";
import { bookingDisabledPhones } from "@/lib/public-booking-settings";

type Props = {
  message: string;
  locations: Record<"paris" | "sulphur_springs", LocationInfo>;
};

export function BookWhenDisabled({ message, locations }: Props) {
  const phones = bookingDisabledPhones(locations);
  return (
    <div className="min-h-screen bg-[#f4f2ea] pb-16">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="text-xs text-stone-600">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span aria-hidden className="mx-1">
            â€º
          </span>
          <span className="font-semibold text-stone-900">Book</span>
        </nav>
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-[#013a30] sm:text-3xl">Online booking is off</h1>
          <p className="mt-4 leading-relaxed text-stone-700">{message}</p>
          <ul className="mt-6 space-y-3">
            {phones.map((p) => (
              <li key={p.label}>
                <span className="block text-sm font-bold text-[#013a30]">{p.label}</span>
                <a className="text-lg font-black text-[#015949] underline" href={p.href}>
                  {p.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/contact" className="font-bold text-[#015949] underline">
            Contact form
          </Link>{" "}
          Â·{" "}
          <Link href="/services" className="font-bold text-[#015949] underline">
            Our services
          </Link>
        </p>
      </div>
    </div>
  );
}
