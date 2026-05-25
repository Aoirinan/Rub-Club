# Branding and assets

This project must **not** use another vendor’s product branding (for example a scheduling SaaS logo, color system, or UI chrome).

## What we use today

| Asset | Source | Notes |
|-------|--------|--------|
| **The Rub Club** / **Chiropractic Associates** names, copy, phones | Clinic’s own marketing | Verbatim/truthful use of the practices’ trade names — not a third-party brand. |
| **Logos in header** (`BrandLogoStrip`) | Rub Club: legacy practice website CDN; Chiro: `public/logos/` (replace with file from Sean); SS: `public/logos/sulphur-springs-icon.webp` + `SulphurSpringsLockup` | Logos are the **clinic’s** lockups from their own sites, not EZnet or other scheduler vendors. |
| **Photos / hero images** (`lib/home-images.ts`) | `cdcssl.ibsrv.net` (Baystone-hosted files from the practices’ existing public sites) | Stock and staff photos the clinic already published; migrate to Firebase Storage or `/public` when you want zero dependency on the old host. |
| **Admin scheduler UI** | Generic slate/teal app styling | No EZnet (or other vendor) layout, logos, or trademarked marks. |
| **Service type seed list** | Internal defaults (names/prices/durations) | Operational data only — not vendor branding. Editable in Super Admin → Scheduler service types. |

## Do not add

- EZnet (or any former scheduler vendor) logos, favicons, login screens, or color palettes.
- “Powered by …” marks for vendors you are replacing.
- Hotlinked assets from a **competitor’s** domain (only the clinic’s own domains/CDNs or files they provide).

## Recommended before production

1. Replace `public/logos/chiropractic-associates.webp` with the final lockup file from the clinic (see `public/logos/README.md`).
2. Add `public/logos/rub-club.png` (or `.webp`) from the clinic and point `BrandLogoStrip` at `BRAND_LOGOS.rubClub` instead of the legacy CDN URL in `lib/home-images.ts`.
3. Upload hero/staff images to your own storage and update `home-images.ts` / CMS so the site does not depend on the old website host CDN.
