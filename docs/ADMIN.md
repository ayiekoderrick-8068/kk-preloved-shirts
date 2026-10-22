# Admin & product management

## One-time Supabase setup

1. Create a project at supabase.com.
2. SQL editor → run `supabase/schema.sql`. This creates `products`, `admins`, RLS policies and the `product-images` storage bucket.
3. Authentication → Users → add the shop owner (email + password). Disable public sign-ups under Authentication → Providers → Email.
4. Make that user an admin (replace the email):
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'owner@example.com';
   ```
5. Copy the project URL and **anon** public key into `.env.local` / Vercel as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Do not use the service-role key anywhere in this repo.

## Security model

- The public can only `select` products whose status is not `archived`.
- `insert` / `update` / `delete` on products and all writes to the photo bucket require `public.is_admin()`, i.e. a signed-in user listed in `public.admins`. This is enforced in the database, so a modified frontend cannot bypass it.
- Validation is repeated as CHECK constraints (price, SKU format, size/condition values, quantity ≥ 0, ≥ 1 image).
- The `/admin` page is `noindex` and disallowed in `robots.txt`, but its real protection is the sign-in + RLS above.

## Day-to-day workflow

1. Go to `/admin` and sign in.
2. First time only: **Import the starter shirts** (seeds names and photos; price and everything else stays unverified). Photo files must be deployed with the site (`public/assets/products/`) or replaced by uploaded images.
3. For each shirt, physically check it, then **Edit** and fill in: verified size, condition, measurements (cm, laid flat), flaws (or tick "no flaws found"), stock quantity (usually 1), and the final name/price.
4. **Mark sold** only after the shop has actually confirmed an order. **Archive** hides a shirt from the storefront without deleting it; **Restore** brings it back.
5. **Add shirt** creates a new product. Upload real photos of that exact item (JPEG/PNG/WebP, max 5 MB) or paste an image URL.

## Demo mode (no Supabase)

If the Supabase variables are blank, `/admin` works on a browser-local copy so you can try the workflow. Nothing is shared with customers. "Reset demo data" restores the seed.
