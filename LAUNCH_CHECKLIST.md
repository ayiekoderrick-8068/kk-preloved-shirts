# Launch checklist

Nothing below has been invented; each item is either blank or marked "to confirm" in the site until you provide it.

## Business details still needed (set as env vars, see `.env.example`)

Supplied by the owner and already in the site (please re-check): WhatsApp/call 0782718496 and 0741973359, booking fee "@200" (shown as KES 200 **per item**), payment via Pochi la Biashara 0113138779, shop description text, logo.

- [ ] Confirm the booking fee really is KES 200 *per item* (the original wording was "@200")
- [ ] Confirm which number is primary: order requests go to 0782718496
- [ ] Public contact email → `VITE_CONTACT_EMAIL`
- [x] Instagram `k.kpre_loved_shirts` and TikTok `@k.kpre_loved_shirts` (TikTok name "Kk_Pre-Loved Shirts") supplied 2026-10-29 and set as defaults; change in Shop Settings if they differ
- [x] Slogan "We scour the best thrifts" confirmed by the owner ("scour", not "scout")
- [ ] WhatsApp Business: the owner **does not have a WhatsApp Business account yet** ("I can get one"). Order requests currently go to the ordinary WhatsApp number 0782718496 (also shown in the TikTok bio with 0741973359). Once she creates the Business account, enter its number in Shop Settings
- [ ] Logo: the illustrated "PREE-LOVED" logo is also her **TikTok profile picture**. Confirm she is happy to move to the new KK tag, or keep the illustration (re-upload it in Shop Settings, Logo)
- [ ] Store city and pickup arrangements → `VITE_STORE_CITY`, `VITE_PICKUP_INFO`
- [ ] Delivery locations, costs / quote process and timing → `VITE_DELIVERY_INFO`
- [ ] Approved returns/exchanges policy → `VITE_RETURNS_POLICY`
- [ ] Logo: the supplied logo banner reads "PREE-LOVED" - confirm the spelling is intended. `public/logo.png` is 564 KB; compress it for faster loads.
- [ ] Final domain → `VITE_SITE_URL` (canonical URLs, Open Graph, sitemap)
- [ ] Other payment methods, if any (the site deliberately does not take payment; Pochi la Biashara is shown for the booking fee)

## Per-shirt data (36 seed items, KK-01 … KK-36)

**Pricing (from the owner):** KES 350 for one shirt, KES 600 for two (`src/lib/pricing.ts`, applied to every shirt without its own price). 
- [ ] Confirm what happens with 3+ shirts. Currently assumed: each full pair is KES 600 and a leftover single is KES 350 (3 shirts = 950, 4 = 1,200).
- [ ] Confirm the pair deal applies to any two shirts (not only matching sleeve types).

Built from the shop's own photos (`public/assets/products/`). For every shirt the shop must supply: exact size, measurements, condition, flaws, stock count (usually 1) and the true product name. Until verified they show "Details to confirm". Names are plain descriptions of what the photo shows, not verified product names. Prototype prices and badges ("Bestseller") were dropped as unsubstantiated.

- [ ] **Check the photo grouping.** Photos were grouped per shirt by eye from contact sheets, so a product may contain a photo of a different shirt or miss one. Fix in `/admin` (Photos) or in `src/data/seed.ts`.
- [ ] 27 photos (indoor set: #4–9, 12–15, 35–38, 43–52, 55–56, 66, 70) show cream/sage/striped shirts that could not be told apart reliably and were **not added**. Tell me which shirts they are (or which photos belong together) and they can be added.
- [ ] The original 19 cut-out images are kept in `public/assets/shirt-NN.webp` but are no longer used.

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
