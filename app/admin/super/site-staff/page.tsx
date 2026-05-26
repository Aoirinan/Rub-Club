import { redirect } from "next/navigation";

/** Office staff editing moved to the website editor. */
export default function SiteStaffAdminPage() {
  redirect("/admin/super/page-builder?scope=paris-staff");
}
