export function SiteFooter() {
  const label = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

  return (
    <footer className="border-t-4 border-[#0f5f5c] bg-[#23312e] py-6 text-center text-xs text-white/70">
      <p>Copyright © 2026 The Rub Club and Chiropractic Associates</p>
      <p className="mt-1">Build {label}</p>
    </footer>
  );
}
