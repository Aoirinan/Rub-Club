import { redirect } from "next/navigation";

/** Practice pages editing moved into the website editor (page builder). */
export default function PracticePagesAdminPage() {
  redirect("/admin/super/page-builder?scope=practice-pages");
}
