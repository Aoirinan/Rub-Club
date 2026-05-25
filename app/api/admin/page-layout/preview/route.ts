import { NextResponse } from "next/server";
import { getContentMany } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { allCmsFieldIdsForPage, isPageLayoutId } from "@/lib/page-layout";
import { resolveMassageTeamCardsUncached } from "@/lib/massage-team-data";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await requireStaff(req.headers.get("authorization"), "manager");
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pageRaw = new URL(req.url).searchParams.get("page");
  if (!pageRaw || !isPageLayoutId(pageRaw)) {
    return NextResponse.json({ error: "page required" }, { status: 400 });
  }

  const fieldIds = allCmsFieldIdsForPage(pageRaw);
  const extraDoctorKeys =
    pageRaw === "chiropractic" ? [...DOCTOR_CMS_KEYS] : ([] as string[]);
  const cms = await getContentMany([...fieldIds, ...extraDoctorKeys]);

  let teamNames: string[] = [];
  if (pageRaw === "massage") {
    try {
      const team = await resolveMassageTeamCardsUncached();
      teamNames = team.map((m) => m.name);
    } catch {
      teamNames = [];
    }
  }

  let doctorNames: string[] = [];
  if (pageRaw === "chiropractic") {
    const doctors = await getDoctorsForMarketing(cms);
    doctorNames = doctors.map((d) => d.name).filter(Boolean);
  }

  return NextResponse.json({ cms, teamNames, doctorNames });
}
