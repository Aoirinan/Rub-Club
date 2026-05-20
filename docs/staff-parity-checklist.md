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

1. Admin → Site content → **Paris staff** → edit one bio → Save.
2. Open `/locations/paris/staff` within ~60 seconds and confirm the bio updated.
3. Admin → Site content → **Massage team** → confirm Channety’s optional Role field matches what you want on massage pages (defaults to Licensed Massage Therapist if using code fallbacks).
