# Connecting and testing a live Supabase project

Status: **never run against a real Supabase project.** The SQL is tested only on a local in-memory Postgres (PGlite) by `npm run test:db`, and the browser flows only against a mocked Supabase API. Treat everything below as a checklist to prove it live, on a **new, empty project**, before any real shop data or customers.

Nothing here requires a paid plan, and nothing in this repo creates a Supabase project, changes production data, or deploys.

## What the project needs

| Piece | Where it comes from |
|---|---|
| Tables, RLS policies, `product-images` bucket | `supabase/schema.sql` |
| Categories, drafts/reserved, publish dates, shop settings, inquiries log | `supabase/migrations/20261029_stock_management.sql` |
| Private `product-originals` bucket (admin only) | `supabase/migrations/20261030_private_originals.sql` |
| Two public values for the website | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

Run the three SQL files **in that order**. Each is safe to run twice. Never put the `service_role` key anywhere in this project; the website only uses the public anon key and relies on Row Level Security.

## Setup steps (about 20 minutes)

1. **Create a project** at supabase.com (a Free-plan project is enough to test). Choose a region close to Kenya's users. Save the database password somewhere safe.
2. **Run the SQL.** SQL Editor, then paste and run, in order: `schema.sql`, `20261029_stock_management.sql`, `20261030_private_originals.sql`. Each should finish with "Success".
3. **Create the owner login.** Authentication, then Users, then Add user (email and password, tick "Auto confirm"). Then Authentication, then Providers, then Email: turn **off** "Allow new users to sign up" so nobody else can create accounts.
4. **Make that user an admin** (SQL editor, use the real email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'owner@example.com';
   ```
5. **Check the buckets** (Storage). `product-images` must be **Public**. `product-originals` must be **Private**. If either is wrong, re-run the SQL file that creates it.
6. **Put the two public values in the site.** Settings, then API: copy *Project URL* and the *anon public* key.
   - Local test: create `.env.local` with `VITE_SUPABASE_URL=...` and `VITE_SUPABASE_ANON_KEY=...`, then `npm run dev`.
   - Hosting (Vercel): add the same two variables to the project environment. A **redeploy is needed once** for the build to pick them up; stock changes afterwards need no redeploy. (Do not deploy without approval.)
7. In `/admin` sign in, open Products, and use **Import the starter shirts** once if you want the 36 seed shirts in the database. A fresh database starts empty and the public shop will show no products until stock is added or imported.

Optional env vars (shop details) are listed in `.env.example`. Leaving them blank is fine: nothing is invented, and the owner can set WhatsApp, Instagram, TikTok, slogan and announcement later in Admin, Shop Settings (the database values override blanks and defaults).

## Live test checklist

Record each result. Do not mark the integration verified until all pass on the live project.

**Security (use the anon key only; replace `$URL` and `$ANON`)**
- [ ] `curl "$URL/rest/v1/products?select=sku" -H "apikey: $ANON"` returns only live products (no drafts or archived).
- [ ] `curl -X POST "$URL/rest/v1/products" -H "apikey: $ANON" -H "Content-Type: application/json" -d '{"sku":"HACK-1","name":"x","category":"Short sleeve"}'` is refused (401/403, "row-level security").
- [ ] `curl -X PATCH "$URL/rest/v1/shop_settings?id=eq.1" -H "apikey: $ANON" -H "Content-Type: application/json" -d '{"slogan":"hacked"}'` changes nothing.
- [ ] `curl "$URL/rest/v1/admins" -H "apikey: $ANON"` returns an empty list.
- [ ] `curl "$URL/rest/v1/inquiries" -H "apikey: $ANON"` returns an empty list (visitors can insert but never read).
- [ ] `curl -I "$URL/storage/v1/object/public/product-originals/anything"` is **not** 200 (originals are never public).
- [ ] A second signed-in user who is not in `admins` sees "not an admin" in `/admin` and cannot save anything.

**Owner workflow (as the admin, on the live site or `npm run dev`)**
- [ ] Sign in; the yellow "Demo mode" banner is **not** shown.
- [ ] Add New Stock with 2-3 real phone photos; Preview; Publish. It appears under New Arrivals and in search without a redeploy.
- [ ] In Storage, `product-images` has three sizes per photo and `product-originals` has one `<id>-original` file. The original is larger and byte-identical to the camera file.
- [ ] On the product's photos, the **Original** button downloads the original (signed link, expires in 2 minutes).
- [ ] Edit the price, change quantity, mark Reserved, then Sold out; reload the public shop and confirm each change persisted.
- [ ] Failed save: turn off the network and press Publish; a clear error appears and nothing is half-saved.
- [ ] Shop Settings: save WhatsApp, Instagram, TikTok, slogan and announcement; the public site shows them after a reload; bad values (wrong host, short number) are rejected with a message.
- [ ] Customer side: open a product, click WhatsApp, confirm the message has the right name, size, price and link, and that stock did **not** change.

**Browser suite** (`npx playwright test`) runs against mocks. It is useful but is **not** proof that Supabase works; the checklist above is.

## Things to know

- Orphaned originals: removing a photo from a product keeps its original in `product-originals` (that is the point of preserving it). Delete unwanted ones in the Storage dashboard.
- Photos uploaded before `20261030_private_originals.sql` was applied, and the built-in seed photos, have no original; the **Original** button only appears for photos the app uploaded.
- If the original cannot be saved (for example the bucket is missing), the shop copy is still saved and the owner sees a warning.
- Demo mode (no env vars) stores small copies in one browser only and never keeps originals.

## Storage requirements and cost

Supabase's published pricing (checked [supabase.com/pricing](https://supabase.com/pricing) and the [storage pricing](https://supabase.com/docs/guides/storage/pricing) and [egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress) docs on 2026-10-29; prices change, so confirm before committing):

| | Free | Pro (from $25 / month) |
|---|---|---|
| File storage included | 1 GB | 100 GB, then about $0.021 per GB per month |
| Egress included | 5 GB (shared across the organisation) | 250 GB, then $0.09 per GB uncached ($0.03 cached) |

Pro has a spend cap on by default. On Free, going over quota triggers a notice and a grace period rather than a bill.

What one photo costs in storage:

- **Storefront copies** (480, 960 and 1600 px WebP): roughly 0.2 to 0.4 MB per photo in total. For reference, the built-in 1100 px photos average 64 KB each.
- **Camera original:** typically 2 to 6 MB per phone photo (a limit of 25 MB each is enforced).

| Catalogue | Photos (3 per item) | Storefront copies | Originals (3 MB avg) | Fits Free (1 GB)? |
|---|---|---|---|---|
| 36 items | 108 | about 40 MB | about 0.3 GB | yes |
| 100 items | 300 | about 0.1 GB | about 0.9 GB | borderline |
| 250 items | 750 | about 0.25 GB | about 2.3 GB | no, needs Pro |

Takeaways: the storefront copies are tiny; **originals dominate cost**. Keeping originals for 100+ items outgrows the Free plan, so either upgrade to Pro (100 GB covers many thousands of photos) or tick off "keep the original" for items where it does not matter. Customer browsing costs egress, not storage: images are cached for a year and served as small copies, so 5 GB of Free egress is a limit to watch once traffic grows, not on day one.

These figures are estimates from file sizes, not measurements from a live project. Re-check usage in the Supabase dashboard after the first week.
