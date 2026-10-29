# Branding: status and logo concepts

**Nothing in this folder is used by the website.** The live site still uses the supplied logo (`public/logo.png`). The concepts below are proposals for the owner to approve.

## Needs confirmation (flagged, not changed)

1. **"PREE-LOVED" on the logo.** The supplied logo banner reads **PREE-LOVED** (see `logo-original.png`). The site copy everywhere else says **Pre-loved**. Please confirm whether "PREE" is an intended brand spelling or a typo in the artwork. If it is a typo the logo artwork must be redrawn; the website text was not changed.
2. **Shop name.** The site currently shows **"KK Pre-Loved Shirts"** (set in `src/lib/config.ts`, editable in Admin → Shop Settings → Shop name). The brief refers to **"Kendy Thrift Shop"** and a **KS** monogram. These do not match. Please confirm the official name. The concepts below use "Kendy Thrift Shop" as requested; the live site name was not changed.
3. **Approved slogan.** Not provided, so none is shown (Shop Settings → Shop slogan).

## Concepts (`docs/brand/concepts/`)

Open `concept-sheet.png` to compare all three on light and dark backgrounds.

| Concept | Idea |
|---|---|
| **A: Hanger** | KS inside a ring with a clothes-hanger hook on top |
| **B: Tag** | KS knocked out of a terracotta clothing tag with a stitched edge; the most recognisable at favicon size |
| **C: Open** | KS with no container; quiet and editorial, ink K and terracotta S |

## Comparison and recommendation

`concepts/comparison.png` shows every concept at favicon (16 / 32 / 48 px), small, desktop-header and phone-header sizes, on both light and dark backgrounds.

| | A Hanger | B Tag | C Open |
|---|---|---|---|
| 16 px favicon | hook and thin ring vanish | solid shape, clear | letters thin out |
| Phone header (36 px) | hook is a speck | clear | weak presence, reads like plain text |
| Dark background | good | good | good |
| Says "clothing / thrift" | strongest idea | tag and stitch say "pre-loved" | none, only initials |
| Distinct as an app icon | OK | strongest | weakest |

**Recommendation: Concept B (Tag).** It is the only one that stays crisp and recognisable at 16 px and on a phone header, it gives a ready-made square icon for the favicon, home-screen and social profile pictures, and the clothing-tag and stitching detail tells the "pre-loved" story. Use the light lockup on the paper background and the dark lockup on the dark footer.

Caveats before approving any concept: confirm the shop name first (see above) because the wordmark text depends on it, and note these are concept drawings. A designer should refine letter shapes and spacing before print use.

Colours come from the existing site palette: ink `#262622`, terracotta `#a24d35`, paper `#f6f4ef`. The dark versions use a lighter terracotta `#e39a7f`.

For each concept there are: `concept-<x>-monogram-light|dark.svg`, `concept-<x>-lockup-light|dark.svg` (monogram + wordmark) and `concept-<x>-favicon.svg` / `-favicon-32.png`.

Notes and limits:

- The K and S are drawn as vector strokes, so they do not depend on a font. The **"Kendy / THRIFT SHOP" wordmark is live text** in Manrope (with Arial fallback) so it can change with the approved name; before final print or app-icon use, convert it to outlines in a vector editor.
- These are concept quality: spacing and optical balance would be refined after a direction is chosen.

## Activating an approved concept

1. Copy the chosen SVG/PNG files into `public/` and upload the lockup under Admin → Shop Settings → Logo (or replace `public/logo.png` and the favicon files).
2. Update `index.html` favicon links.
3. Regenerate or replace the small logo copies (`public/logo-112|224.*`, `apple-touch-icon.png`, `favicon-48.png`) by pointing the `original` path in `scripts/optimize-images.mjs` at the approved artwork and running `node scripts/optimize-images.mjs`.

## Regenerating

`node scripts/generate-logo-concepts.mjs` rebuilds the concept files.
