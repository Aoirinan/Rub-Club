import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Paris Wellness <span className="text-slate-500">&</span> Spine
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link className="hover:text-slate-900" href="/#services">
            Services
          </Link>
          <Link className="hover:text-slate-900" href="/#locations">
            Locations
          </Link>
          <Link
            className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            href="/book"
          >
            Book
          </Link>
          <Link className="hover:text-slate-900" href="/admin/login">
            Staff
          </Link>
        </nav>
      </div>
    </header>
  );
}
