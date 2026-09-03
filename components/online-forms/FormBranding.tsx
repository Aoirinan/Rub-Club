import { telHref } from "@/lib/constants";
import { getDisplayLocationsFull } from "@/lib/display-locations";
import { getUiText } from "@/lib/ui-text";

type Office = {
  name: string;
  address?: string;
  phone: string;
};

/** "903-785-5551" → "(903) 785-5551"; anything that is not 10 digits is shown as typed. */
function displayPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}

/**
 * Office footer under every online form. Names come from Site text, the
 * address/phone from Office info & hours (same overrides as the header).
 */
export async function FormBranding({ brand }: { brand?: "chiropractic" | "rub_club" }) {
  const [locations, t] = await Promise.all([getDisplayLocationsFull(), getUiText()]);
  const paris = locations.paris;
  const sulphur = locations.sulphur_springs;

  const chiroOffices: Office[] = [
    {
      name: t.ui_form_office_paris_name,
      address: paris.addressLines.join(", "),
      phone: displayPhone(paris.phonePrimary),
    },
    {
      name: t.ui_form_office_ss_name,
      address: sulphur.addressLines.join(", "),
      phone: displayPhone(sulphur.phonePrimary),
    },
  ];
  const rubClubOffice: Office = {
    name: t.ui_form_office_rubclub_name,
    address: paris.shortName,
    phone: displayPhone(paris.phoneSecondary ?? paris.phonePrimary),
  };

  const offices = brand === "rub_club" ? [rubClubOffice] : chiroOffices;
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
      <p className="mt-4 text-xs text-stone-500">{t.ui_form_secure_note}</p>
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
