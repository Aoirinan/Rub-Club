import { redirect } from "next/navigation";

/**
 * Practice pages editing is now integrated per-page into the website editor:
 * the Home, Chiropractic, and Sulphur Springs scopes embed the practice editor.
 */
export default function PracticePagesAdminPage() {
  redirect("/admin/super/page-builder?scope=home");
}
