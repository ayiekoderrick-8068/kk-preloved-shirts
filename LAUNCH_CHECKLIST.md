# Launch checklist

Nothing below has been invented; each item is either blank or marked "to confirm" in the site until you provide it.

## Business details still needed (set as env vars, see `.env.example`)

- [ ] Verified WhatsApp business number with country code → `VITE_WHATSAPP_NUMBER` (until set, checkout copies the order text instead of opening WhatsApp)
- [ ] Public contact email → `VITE_CONTACT_EMAIL`
- [ ] Official Instagram URL → `VITE_INSTAGRAM_URL`
- [ ] Store city and pickup arrangements → `VITE_STORE_CITY`, `VITE_PICKUP_INFO`
- [ ] Delivery locations, costs / quote process and timing → `VITE_DELIVERY_INFO`
- [ ] Approved returns/exchanges policy → `VITE_RETURNS_POLICY`
- [ ] Official logo (the header currently uses a typographic "KK." mark)
- [ ] Final domain → `VITE_SITE_URL` (canonical URLs, Open Graph, sitemap)
- [ ] Payment methods the shop accepts (the site deliberately does not take payment)

## Per-shirt data (19 seed items, KK-01 … KK-19)

For every shirt: exact size, measurements, condition, flaws, stock count (usually 1), final price and true product name. Until verified they show "Details to confirm". Names and prices are carried over from the prototype and are **unverified**; prototype badges such as "Bestseller" were dropped as unsubstantiated.

## Backend (needed before real multi-user inventory)

- [ ] Create Supabase project, run `supabase/schema.sql`, create the owner user and add them to `admins` (see `docs/ADMIN.md`)
- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel; import seed products and verify each one
- [ ] Disable public sign-ups in Supabase Auth

## Known limitations / not done

- **Supabase is not connected or tested against a live project.** Schema and client code are written and typechecked, but no database was available. Test sign-in, import, edit, upload and RLS on a real project before launch.
- No online payment and no order records: orders exist only as WhatsApp messages. There is no order-management screen or stock reservation; mark items sold manually.
- The sitemap lists static pages and the 19 seed products only.
- Screen-reader behaviour was built to spec (dialog roles, focus trap/restore, labelled controls) but not tested with a real screen reader.
- The Figma file was not opened; layout follows the prototype and brief.
