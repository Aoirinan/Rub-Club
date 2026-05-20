# Office hours vs online booking slots

## What visitors see (phase 1 — Site content)

| Location | Admin path | Format (one line per row) |
|----------|------------|---------------------------|
| **Paris** (home footer, contact, `/locations/paris`) | Site content → **Paris office** → Office hours | `Monday\|9:00 AM – 5:00 PM` |
| **Sulphur Springs** (SS hub, `/locations/sulphur-springs`) | Site content → **Sulphur Springs** → Hours | `Monday – Friday\|9:00 AM – 5:00 PM` or `Saturday – Sunday\|Closed` |

You can also use `Monday: 9:00 AM – 5:00 PM` or `Monday – 9:00 AM – 5:00 PM` — the site parses common formats.

If a field is empty in Firestore, defaults from the codebase are used until you save a value in Site content.

**New field:** After deploy, run `npm run seed:content` once (or add `paris_hours` manually in Site content) if Paris hours do not appear in the editor list.

## Online appointment slots (phase 2)

When public booking is turned on, available times come from **Admin → Super → Operations → Providers**:

- Each provider has **service lines** (massage, chiropractic, stretch) and optional **custom hours** (open/close per day).
- Without custom hours, slots use the default **9:00 AM–5:00 PM** Chicago window.

That is separate from the marketing “office hours” text above.
