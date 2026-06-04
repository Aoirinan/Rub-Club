# Brand logos (clinic-owned only)

Place **final artwork from the clinic** here. Do not commit logos or lockups from scheduling vendors (e.g. EZnet) or other third-party products.

| File | Purpose |
|------|---------|
| `chiropractic-associates.png` | Chiropractic Associates Paris, TX lockup — wired in `lib/brand-logos.ts` / header. |
| `rub-club.png` (or `.webp`) | The Rub Club lockup — add when provided; then wire `BrandLogoStrip` to `BRAND_LOGOS.rubClub` instead of the legacy CDN URL in `lib/home-images.ts`. |
| `sulphur-springs-icon.webp` | Sulphur Springs spine-in-circle mark; header lockup pairs this with type in `SulphurSpringsLockup`. |

After adding files, update paths in `lib/brand-logos.ts` if filenames change.

See also: [`docs/branding-assets.md`](../../docs/branding-assets.md).
