import { readFileSync } from "fs";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { listMassageTherapistsForOwnerMarketing } from "@/lib/massage-therapist-options";
import { buildOwnerVideoQuotaSnapshot } from "@/lib/owner-upload-quota";
import { getFirestore } from "@/lib/firebase-admin";
import { mergeHeaderColors, validateHeaderColorConfig } from "@/lib/header-colors";
import { getSiteOwnerConfig, setSiteOwnerConfigPatch, type SiteOwnerSingleton } from "@/lib/site-owner-config";
import { authorizeOwnerMarketing, unauthorizedOwnerMarketing } from "@/lib/owner-marketing-auth";
import { requireStaff } from "@/lib/staff-auth";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export const runtime = "nodejs";

const htmlField = z.string().max(20_000);
const shortText = z.string().max(500);
const urlish = z.string().max(2000);
const hexColor = z.string().max(32);

const bandColorsSchema = z
  .strictObject({
    phoneBarBg: hexColor,
    logoRowBg: hexColor,
    navBg: hexColor,
    navHover: hexColor,
  })
  .partial();

const navChildSchema = z.strictObject({ label: shortText, href: urlish });
const navItemSchema = z.strictObject({
  label: shortText,
  href: urlish,
  external: z.boolean().optional(),
  children: z.array(navChildSchema).max(50).optional(),
});

/** Every field of SiteOwnerSingleton, all optional (PATCH merges into the stored doc). */
const configPatchSchema = z
  .strictObject({
    banner: z
      .strictObject({
        enabled: z.boolean(),
        showOnHomepage: z.boolean(),
        html: htmlField,
        expiresAt: z.string().max(40).nullable(),
      })
      .partial(),
    specials: z
      .strictObject({
        massageHtml: htmlField,
        chiroHtml: htmlField,
        generalHtml: htmlField,
        massageImageUrl: urlish,
        massageImageStoragePath: urlish,
        chiroImageUrl: urlish,
        chiroImageStoragePath: urlish,
        generalImageUrl: urlish,
        generalImageStoragePath: urlish,
        modalTitle: shortText,
        closeLabel: shortText,
      })
      .partial(),
    testimonialVideos: z
      .array(
        z.strictObject({
          id: z.string().min(1).max(200),
          title: shortText,
          label: shortText,
          massageMemberId: z.string().max(200).optional(),
          url: urlish,
          storagePath: urlish.optional(),
          createdAt: z.string().max(64),
        }),
      )
      .max(200),
    doctorMedia: z
      .array(
        z.strictObject({
          id: z.string().min(1).max(200),
          doctorKey: z.enum(["greg", "sean", "brandy"]),
          caption: shortText,
          mediaType: z.enum(["photo", "video"]),
          url: urlish,
          storagePath: urlish.optional(),
          sortOrder: z.number().int(),
        }),
      )
      .max(500),
    editableCopy: z
      .strictObject({
        parisChiroPhone: shortText,
        sulphurChiroPhone: shortText,
        rubClubMassagePhone: shortText,
        giftCardOrderUrl: urlish,
        giftCardStickyEnabled: z.boolean(),
        giftCardStickyLabel: shortText,
        gbpParisReviewUrl: urlish,
        gbpSulphurReviewUrl: urlish,
        awardsStripHtml: htmlField,
        footerBlurbHtml: htmlField,
      })
      .partial(),
    publicBooking: z
      .strictObject({
        enabled: z.boolean(),
        disabledMessage: z.string().max(2000),
        onlinePaymentsEnabled: z.boolean(),
      })
      .partial(),
    businessNavigation: z
      .strictObject({
        parisChiro: z.array(navItemSchema).max(100),
        sulphurSprings: z.array(navItemSchema).max(100),
      })
      .partial(),
    headerColors: z
      .strictObject({
        paris: bandColorsSchema,
        sulphurSprings: bandColorsSchema,
      })
      .partial(),
  })
  .partial();

export async function GET(req: Request) {
  const marketingAuth = await authorizeOwnerMarketing(req);
  if (!marketingAuth.ok) return unauthorizedOwnerMarketing();
  const config = await getSiteOwnerConfig();
  let massageTeamMembers: { id: string; name: string }[] = [];
  let massageTherapistSource: "team" | "providers" | null = null;
  try {
    const listed = await listMassageTherapistsForOwnerMarketing(getFirestore());
    massageTeamMembers = listed.members;
    massageTherapistSource = listed.source;
  } catch {
    massageTeamMembers = [];
    massageTherapistSource = null;
  }
  const videoQuota = buildOwnerVideoQuotaSnapshot(config);
  let appVersion = "";
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    appVersion = typeof pkg.version === "string" ? pkg.version : "";
  } catch {
    /* ignore */
  }
  return NextResponse.json({
    config,
    appVersion,
    massageTeamMembers,
    massageTherapistSource,
    videoQuota,
  });
}

/**
 * Writes are superadmin-only (the marketing UI is gated the same way): the stored
 * HTML snippets render unsanitized on every public page.
 */
async function authorizeConfigWrite(req: Request): Promise<boolean> {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (staff) return true;
  return isSuperadminRequest(req.headers.get("cookie"));
}

export async function PATCH(req: Request) {
  if (!(await authorizeConfigWrite(req))) return unauthorizedOwnerMarketing();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = configPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid config patch" }, { status: 400 });
  }
  let patch = parsed.data as Partial<SiteOwnerSingleton>;
  if (patch.headerColors !== undefined) {
    const merged = mergeHeaderColors(patch.headerColors);
    const validation = validateHeaderColorConfig(merged);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    patch = { ...patch, headerColors: merged };
  }
  const next = await setSiteOwnerConfigPatch(patch);
  if (patch.headerColors !== undefined) {
    revalidatePath("/", "layout");
  }
  return NextResponse.json({ config: next });
}
