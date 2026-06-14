import { telHref } from "@/lib/constants";

type Office = {
  name: string;
  address?: string;
  phone: string;
};

const CHIRO_OFFICES: Office[] = [
  {
    name: "Chiropractic Associates",
    address: "3305 NE Loop 286, Suite A, Paris, TX 75460",
    phone: "(903) 785-5551",
  },
  {
    name: "Chiropractic Associates of Sulphur Springs",
    address: "207 Jefferson St. E, Sulphur Springs, TX 75482",
    phone: "(903) 919-5020",
  },
];

const RUB_CLUB_OFFICE: Office = {
  name: "The Rub Club",
  address: "Paris, TX",
  phone: "(903) 739-9959",
};

export function FormBranding({ brand }: { brand?: "chiropractic" | "rub_club" }) {
  const offices = brand === "rub_club" ? [RUB_CLUB_OFFICE] : CHIRO_OFFICES;
  return (
    <footer className="mt-12 border-t border-stone-200 pt-6 text-sm text-stone-600">
      <div className="grid gap-4 sm:grid-cols-2">
        {offices.map((o) => (
          <div key={o.name}>
            <p className="font-bold text-[var(--pp-heading)]">{o.name}</p>
            {o.address ? <p>{o.address}</p> : null}
            <a href={telHref(o.phone)} className="font-semibold hover:underline">
              {o.phone}
            </a>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-stone-500">
        Your information is sent securely to our office and is only viewable by our staff.
      </p>
      <p className="mt-1 text-xs text-stone-500">
        <a
          href="https://www.chiropracticparistexas.com"
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.chiropracticparistexas.com
        </a>
      </p>
    </footer>
  );
}
