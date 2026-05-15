import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";

const COL = "site_owner_settings";
const DOC = "singleton";

export type BannerConfig = {
  enabled: boolean;
  showOnHomepage: boolean;
  html: string;
  /** ISO date end-of-day expiry, or null = no expiry */
  expiresAt: string | null;
};

export type SpecialsConfig = {
  massageHtml: string;
  chiroHtml: string;
  generalHtml: string;
  /** Shown above the HTML body; blank falls back to "Specials". */
  modalTitle: string;
  /** Primary button label; blank falls back to "Close". */
  closeLabel: string;
};

export type TestimonialVideoItem = {
  id: string;
  title: string;
  label: string;
  /** Public HTTPS URL (Firebase Storage or /public path) */
  url: string;
  /** When stored in Firebase Storage — used for delete */
  storagePath?: string;
  createdAt: string;
};

export type DoctorMediaItem = {
  id: string;
  doctorKey: "greg" | "sean" | "brandy";
  caption: string;
  mediaType: "photo" | "video";
  url: string;
  storagePath?: string;
  sortOrder: number;
};

/** Owner-editable phones, links, and short HTML snippets (blank field = use code default). */
export type SiteEditableCopy = {
  parisChiroPhone: string;
  sulphurChiroPhone: string;
  rubClubMassagePhone: string;
  giftCardOrderUrl: string;
  /** Homepage amber strip under hero (HTML). */
  awardsStripHtml: string;
  /** Footer intro column (HTML). */
  footerBlurbHtml: string;
};

export const DEFAULT_EDITABLE_COPY: SiteEditableCopy = {
  parisChiroPhone: "",
  sulphurChiroPhone: "",
  rubClubMassagePhone: "",
  giftCardOrderUrl: "",
  awardsStripHtml: "",
  footerBlurbHtml: "",
};

export type SiteOwnerSingleton = {
  banner: BannerConfig;
  specials: SpecialsConfig;
  testimonialVideos: TestimonialVideoItem[];
  doctorMedia: DoctorMediaItem[];
  editableCopy: SiteEditableCopy;
};

const DEFAULTS: SiteOwnerSingleton = {
  banner: {
    enabled: false,
    showOnHomepage: true,
    html: "",
    expiresAt: null,
  },
  specials: {
    massageHtml: "<p>Welcome! Ask the front desk about current massage specials.</p>",
    chiroHtml: "<p>Welcome! Ask the front desk about chiropractic new-patient offers.</p>",
    generalHtml: "<p>See the front desk for current specials.</p>",
    modalTitle: "Specials",
    closeLabel: "Close",
  },
  testimonialVideos: [],
  doctorMedia: [],
  editableCopy: DEFAULT_EDITABLE_COPY,
};

function mergeDefaults(partial: Partial<SiteOwnerSingleton> | undefined): SiteOwnerSingleton {
  return {
    banner: { ...DEFAULTS.banner, ...partial?.banner },
    specials: { ...DEFAULTS.specials, ...partial?.specials },
    testimonialVideos: Array.isArray(partial?.testimonialVideos)
      ? partial!.testimonialVideos!
      : DEFAULTS.testimonialVideos,
    doctorMedia: Array.isArray(partial?.doctorMedia) ? partial!.doctorMedia! : DEFAULTS.doctorMedia,
    editableCopy: {
      ...DEFAULT_EDITABLE_COPY,
      ...(partial?.editableCopy ?? {}),
    },
  };
}

export async function getSiteOwnerConfig(db: Firestore = getFirestore()): Promise<SiteOwnerSingleton> {
  const snap = await db.collection(COL).doc(DOC).get();
  if (!snap.exists) return { ...DEFAULTS };
  return mergeDefaults(snap.data() as Partial<SiteOwnerSingleton>);
}

export async function setSiteOwnerConfigPatch(
  patch: Partial<SiteOwnerSingleton>,
  db: Firestore = getFirestore(),
): Promise<SiteOwnerSingleton> {
  const ref = db.collection(COL).doc(DOC);
  await ref.set(
    {
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return getSiteOwnerConfig(db);
}

export function bannerIsActivePublic(banner: BannerConfig, now: Date = new Date()): boolean {
  if (!banner.enabled || !banner.html.trim()) return false;
  if (!banner.expiresAt) return true;
  const end = new Date(banner.expiresAt);
  if (Number.isNaN(end.getTime())) return true;
  end.setHours(23, 59, 59, 999);
  return now <= end;
}
