# Staff parity checklist (before DNS cutover)

Compare each legacy site to the new site. All names should match spelling on the old sites (e.g. **Sarah** Brown, not “Sara”).

## massageparistexas.com — Meet the Team

| Legacy name | New site |
|-------------|----------|
| Ana Vasquez | Home + `/services/massage` massage team |
| Shely Cox | Same |
| Rosylin Wilmore | Same |
| Channety Wooten | Same (role: Licensed Massage Therapist on massage pages) |
| Brandi Boren | Same (role: LMT/Manager on massage pages) |

## chiropracticparistexas.com/staff — Paris office

| Legacy name | Legacy role | New site |
|-------------|-------------|----------|
| Brandi Boren | Insurance Coordinator | `/locations/paris/staff` |
| Sarah Brown | Personal Injury Case Manager | `/locations/paris/staff` |
| Shauna Clark | Therapy Tech | `/locations/paris/staff` |
| Shelbie Guthrie | Stretch & Flex Rehab Coach | `/locations/paris/staff` |
| Ashlie Jenkins | Front Desk Receptionist | `/locations/paris/staff` |
| Channety Wooten | Marketing | `/locations/paris/staff` (Marketing); massage pages show LMT role |

Paris chiropractors (Greg Thompson, Sean Welborn, Brandy Collins): `/about` and home chiropractic section.

## chiropracticsulphursprings.com/staff

| Legacy name | New site |
|-------------|----------|
| Dr. Conner Collins | `/sulphur-springs/staff` (featured) |
| Jade Petty, Taylor Harrison | `/sulphur-springs/staff` |
| Leotta Cascia, Brittany Brown, Ashlyn Davis | `/sulphur-springs/staff` |

## Dual roles (intentional)

- **Channety:** Marketing on Paris office page; Licensed Massage Therapist on Rub Club sections.
- **Brandi:** Insurance Coordinator on Paris office page; LMT/Manager on Rub Club sections.

## CMS smoke test (superadmin)

1. Admin → **Office staff** (`/admin/super/site-staff`) → run **Copy current site roster into Firestore** once if the list is empty.
2. Confirm Paris and Sulphur staff appear on `/locations/paris/staff` and `/sulphur-springs/staff` (revalidate ~60s).
3. Add a test staff member, then hide with **Active** unchecked — confirm they disappear from the public page.
4. Admin → Site content → **Paris staff** / **Sulphur staff** → edit **page hero** and CTA only (team members are no longer edited here).
5. Admin → Site content → **Massage team** → massage therapists on home and `/services/massage` (separate from office staff).
