import { Suspense } from "react";
import { OwnerMarketingPanel } from "../_components/OwnerMarketingPanel";

export default function ManagerMarketingPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading settings…</p>}>
      <OwnerMarketingPanel />
    </Suspense>
  );
}
