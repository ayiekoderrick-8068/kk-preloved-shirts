# Claude implementation brief — KK Preloved Shirts

You are a senior full-stack engineer, UX designer and QA engineer. Work in THIS extracted project folder. Start by reading `website/index.html`, `website/assets/`, `PROJECT_BRIEF.md`, and `FIGMA_DESIGN.md`. Inspect the existing code, then implement and test the site. Do not replace the design with a generic storefront or deliver only a plan.

## Goal
Turn the supplied working front-end prototype into a professional, production-ready Kenyan preloved-shirt shop branded **KK Preloved Shirts**. Preserve the distinctive hanging-shirt browsing experience, the polished editorial design, and the 19 real product images supplied. Use the Figma reference for layout direction while keeping the website's real photos rather than the Figma illustration placeholders.

Figma design: https://www.figma.com/design/cS1zgrq4k7SVzLfzkRI9tG
GitHub repository: https://github.com/ayiekoderrick-8068/kk-preloved-shirts

## Critical business rules
- PRELOVED clothing: treat each shirt as a unique physical item unless the seller explicitly sets stock quantity >1. Do NOT assume S/M/L/XL for every garment. Each product must have its ACTUAL size, condition, measurements and available stock as verified by seller. Until verified, show a truthful "Confirm size/availability" state; never claim a size is available without evidence.
- Do not make up the brand's WhatsApp number, address, delivery fees, return policy, payment details or condition grading. Put all missing details into clearly named settings or an admin area and list the information needed before launch.
- Prices should display KES, no surprise delivery charges. Final confirmation may be done over WhatsApp, with no claims that payment has already been processed.
- Sold-out products cannot be added to the cart. Never mark an item sold from merely opening a WhatsApp chat; only mark sold after shop confirmation or an actual verified order workflow.

## Build requirements
1. **Architecture:** Refactor the single HTML file into clean, maintainable components with a sensible React + Vite + TypeScript project (or explain if existing stack differs). Use the provided image assets. Add lint, typecheck and test scripts. Keep dependencies minimal. Make Vercel deployment straightforward.
2. **Brand/UI:** Replace FORME branding with KK Preloved Shirts throughout metadata, headings, cart storage keys and customer-facing text. Refine the typography and cream/charcoal palette. Desktop header with working Home, Shop, About, Contact, Bag links; responsive mobile menu. Accessible headings, alt text, keyboard focus and reduced-motion behavior.
3. **Home:** Elegant hero with interactive horizontal hanging rail (mouse drag, swipe, keyboard arrow controls and visibly clickable previous/next buttons); spotlight featured shirts; CTA to Shop All; genuine trust/policy content only when provided; meaningful footer.
4. **Shop:** All product cards from provided 19-image dataset; search, filter by relevant verified size/condition/category/availability, sort by price and name, clear empty state and quick view. Do not fake product fields: show 'Details to confirm' where data is unavailable.
5. **Product:** Dedicated deep-linkable product page (not only an overlay): gallery for available photos, name, KES price, exact size, measurements, condition, defect disclosures, stock, delivery guidance, and Add to Bag. Multiple image slots only when authentic images exist. Related items.
6. **Cart:** Add/remove, quantities limited by verified stock, clear totals, persist in localStorage with a versioned key, handle stale/unavailable items, empty state and keyboard-accessible drawer or page.
7. **Order flow:** Collect customer full name, reachable phone, delivery vs pickup, city/location, optional notes, and consent to share order details via WhatsApp. Validate required fields and Kenyan phone formats sensibly, without blocking valid international numbers. Generate readable URL-encoded wa.me order text with line items, quantities, sizes and KES subtotal, clearly state 'delivery fee to confirm'. If WhatsApp is not configured, provide copy-to-clipboard plus visible manual-copy fallback. Do not claim order confirmation until seller accepts it.
8. **Stock & management:** For actual multi-user inventory, propose and implement a simple admin-authenticated backend and database (Supabase is acceptable) with products, images, unique SKUs, condition, verified size, measurements, quantities, status and timestamps. Admin can create/edit/archive/mark sold and update images. Server-side authorization and input validation required; no service-role secrets in frontend. If credentials are missing, provide SQL/schema/migrations, .env.example, documented local demo fallback and setup instructions—do not pretend persistence exists.
9. **Trust and SEO:** Accessible contact/About, delivery/returns/FAQ content driven by verified policies, SEO titles/descriptions, canonical configuration, OpenGraph and sitemap where suitable. Avoid fake testimonials, fake guarantees, fake 'secure payment' claims or fabricated business details.
10. **Quality:** Responsive at 320, 375, 768, 1024, 1440 widths. Check loading, interactions, keyboard and screen-reader behavior, focus restoration, image fallbacks, no horizontal overflow, no dead buttons or '#' pseudo-links. Unit tests for inventory/cart/checkout message, plus E2E user journey if Playwright is available. Run build, lint, tests; fix errors.

## Deliverables
- Working project in `website/` or cleanly organized replacement at repository root, with ALL original 19 image assets preserved.
- `README.md` with install, dev, build, Vercel deploy and environment configuration instructions.
- `.env.example` with safe placeholders; NEVER commit real credentials.
- Inventory data import or seed showing exactly what is verified and what's unknown.
- Documented admin and product management workflow.
- `LAUNCH_CHECKLIST.md` with missing business data and any incomplete functionality explicitly identified.
- Summary of real commands executed, test results, files changed, remaining blockers.

## Execution style
Inspect first. Implement in sensible phases, continuously verify. Do not ask broad design questions: choose tasteful defaults consistent with Figma and supplied website. Ask ONLY for essential real-world business details or credentials that cannot be inferred. Do not delete the existing hanging-rail interaction. Do not invent proof that checkout or database works when external configuration is absent. Work with existing Git repository if initialized; do not force-push or overwrite user changes.
