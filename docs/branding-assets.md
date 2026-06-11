# Branding and assets

This project must **not** use another vendor’s product branding (for example a scheduling SaaS logo, color system, or UI chrome).

## What we use today

| Asset | Source | Notes |
|-------|--------|--------|
| **The Rub Club** / **Chiropractic Associates** names, copy, phones | Clinic’s own marketing | Verbatim/truthful use of the practices’ trade names — not a third-party brand. |
| **Logos in header** (`BrandLogoStrip`) | Rub Club: `public/logos/rub-club.webp` (self-hosted); Chiro: `public/logos/chiropractic-associates-wide.png` (rebuild source: `chiropractic-associates.png` via `npm run build:chiro-logo`); SS: `public/logos/sulphur-springs-icon.webp` + `SulphurSpringsLockup` | Logos are the **clinic’s** lockups, not EZnet or other scheduler vendors. |
| **Photos / hero images** (`lib/home-images.ts`) | Self-hosted under `public/images/legacy/` (migrated from the legacy Baystone/`cdcssl.ibsrv.net` CDN via `scripts/download-ibsrv-assets.mjs`) | Stock and staff photos the clinic already published; zero dependency on the old host. |
| **Admin scheduler UI** | Generic slate/teal app styling | No EZnet (or other vendor) layout, logos, or trademarked marks. |
| **Service type seed list** | Internal defaults (names/prices/durations) | Operational data only — not vendor branding. Editable in Super Admin → Scheduler service types. |

## Do not add

- EZnet (or any former scheduler vendor) logos, favicons, login screens, or color palettes.
- “Powered by …” marks for vendors you are replacing.
- Hotlinked assets from a **competitor’s** domain (only the clinic’s own domains/CDNs or files they provide).

## Asset migration (completed)

All images formerly hotlinked from the legacy website host CDN (`cdcssl.ibsrv.net`) are now
self-hosted: logos under `public/logos/`, photos under `public/images/legacy/`
(see `scripts/download-ibsrv-assets.mjs`). Firestore CMS values were rewritten to the local
paths via `scripts/migrate-ibsrv-firestore.ts`. The `cdcssl.ibsrv.net` host was removed from
`next.config.ts` `images.remotePatterns`, so any reintroduced hotlink will fail loudly.
