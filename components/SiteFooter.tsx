export function SiteFooter() {
  const label = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

  return (
    <footer className="border-t border-slate-200 bg-white/90 py-4 text-center text-xs text-slate-500">
      <p>Build {label}</p>
    </footer>
  );
}
