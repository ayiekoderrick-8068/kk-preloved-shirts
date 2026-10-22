# KK Pre-Loved Shirts

A React + Vite + TypeScript storefront for a Kenyan pre-loved men's shirt shop. Every shirt is treated as a unique item; sizes, measurements, condition and stock are shown only once the shop has verified them. Orders are sent as requests over WhatsApp - the site takes no payments.

Keeps the hanging-shirt rail. Products come from the shop's own photos (`public/assets/products/`, 36 shirts); the original 19 cut-out images remain in `public/assets/`. Photos are compressed with `scripts/process-photos.mjs` (sharp).

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in what you have; blanks are handled honestly in the UI
npm run dev                  # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck, generate sitemap, production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest): inventory, cart, order message, phone validation |
| `npm run test:e2e` | Playwright journeys + overflow checks at 320/375/768/1024/1440 px |

Playwright needs Chromium: `npx playwright install chromium` (plus system libraries on Linux: `npx playwright install-deps`, which needs sudo; on rootless WSL see `scripts/setup-browser-libs.sh`).

## How inventory works

- **Without Supabase (default, "demo mode")**: the 36 seed products in `src/data/seed.ts` are shown, each with price "to confirm". Price, size, measurements, condition, flaws and quantity are `null`, so the UI shows "Details to confirm" and "Confirm availability". Admin edits at `/admin` are stored only in that browser's localStorage and are **not** visible to customers.
- **With Supabase**: products live in a database, writes are restricted to signed-in admins by Row Level Security, and photos go to a storage bucket. See [docs/ADMIN.md](docs/ADMIN.md).

Stock rules: sold or zero-stock items cannot be added to the bag; unverified stock is treated as a single unit; a one-off cannot be added twice; carts are reconciled against live inventory (stale/sold lines are removed with a notice). Opening WhatsApp never marks anything sold - only an admin does.

## Ordering

Bag → order details (name, phone, delivery/pickup, location, notes, consent) → a URL-encoded `wa.me` message listing items, quantities, sizes and the KES subtotal, with "Delivery fee: to confirm". Shop contact details supplied by the owner are defaults in `src/lib/config.ts` (WhatsApp 0782 718 496, second line 0741 973 359, booking fee KES 200 per item, Pochi la Biashara 0113 138 779); env vars override them. If the WhatsApp number is blank, the text is copied to the clipboard and shown in a box for manual copying. The UI states the request is not confirmed until the shop replies.

## Environment variables

See `.env.example`. Only `VITE_` public values are used in the browser. **Never put a Supabase service-role key in this project.** `.env*` files are git-ignored.

## Deploy to Vercel

1. Push this repo to GitHub, then "Add New Project" in Vercel and import it (framework: Vite, auto-detected; `vercel.json` handles SPA rewrites).
2. Add the environment variables from `.env.example` under Project → Settings → Environment Variables.
3. Deploy. Set `VITE_SITE_URL` to the final domain first so canonical URLs, Open Graph tags and `sitemap.xml` are correct (the sitemap lists static pages and the 19 seed products; products created later in the database are not auto-listed).

## Project layout

```text
src/lib/        pure logic + tests (inventory, cart, order, validate, repo)
src/context/    products, cart, toast providers
src/components/ header, footer, rail, cards, quick view, cart/checkout drawer, modal
src/pages/      home, shop, product, info pages, admin
supabase/       schema.sql (tables, constraints, RLS, storage)
e2e/            Playwright tests
docs/brief/     original project brief, Figma notes and the prototype (docs/prototype)
```

See also [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).
