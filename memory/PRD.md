# Celesta Glow PRD

## Latest Update: April 26, 2026 (Flipkart-Minutes-grade niche redesign)

### Three-Niche Structure (Flipkart-Minutes clean)
Top sticky 3-pill switcher above brand bar — refined, premium, niche-color active state.
1. **Anti-Aging** (`/`) — flagship Celesta Glow brand line.
2. **Skincare** (`/skincare`) — cyan-themed: Hero → Circular Concern Strip (8 brand-coloured rings) → Trust strip → Bestsellers grid → Skin Analysis CTA.
3. **Cosmetics & Makeup** (`/cosmetics`) — rose-themed: Editorial 3-image hero → Circular Category Strip (Lipstick / Eye / Brow / Face) → Trust strip → Bestsellers grid → Complete-the-Look CTA.

### Drill-in Flow
- `/skincare` → tap Anti-Aging concern circle → `/concern/anti-aging` shows concern hero + **circular Category strip** (Serums / Moisturizers / Sunscreens / Eye Care for that concern) → tap → `/category/:slug` for product list.
- `/cosmetics` → tap Lipstick circle → `/category/lipstick` directly to products.
- All product grids use the trust-rich `<ProductCard>` (flex `h-full` for consistent heights across responsive breakpoints).

### Components
- `components/CircularCategoryStrip.js` — Flipkart-Minutes-style horizontal-scroll strip with hover arrow nav, gradient ring on each circle, image inside, brand-colored ring on hover, snap scroll, mobile 4-up grid.
- `components/NicheSwitcher.js` — refined 3-pill bar (smaller, less padding, more premium).
- `components/ConcernCategoryHub.js` — `ShopByConcern`/`ShopByCategory` legacy exports kept for compatibility but no longer used on niche homes.
- `pages/SkincareHome.js`, `pages/CosmeticsHome.js` — clean 5-section structure.
- `pages/ConcernCategoryPage.js` — concern mode shows category circles first; category mode shows product list.
- `pages/ConcernCategoryPage.js` exports reusable `<ProductCard>` with locked title min-height + responsive padding/typography (mobile/tablet/desktop).

### Product Card alignment fixes
- `flex flex-col h-full` so all cards in a row match height
- Locked min-heights: title = 36/40px, ratings = single line, price = baseline-aligned
- Responsive type ramp: text-[13px] sm:text-[15px], buttons 2.5/3 padding scaling
- Trust footer in 3-col grid for symmetric icon alignment

### Backend (unchanged from previous step)
- Collections: `niches`, `concerns`, `categories`, `products` with `niche`, `concerns[]`, `category` fields.
- 17 products: 5 anti-aging + 5 skincare + 7 cosmetics (Matte Velvet Lipstick, Liquid Eyeliner, Volume Boost Mascara, Cream Blush Stick + 3 originals).
- 10 categories (5 skincare + 5 cosmetics: cosmetics-makeup parent + lipstick + eye-makeup + brow + face-makeup).
- API: `GET /api/niches`, `GET /api/concerns(/:slug)`, `GET /api/categories(/:slug)`, `GET /api/products?niche=&category=&concern=`.
- Idempotent upsert seed.

### Admin (unchanged)
- `/admin/concerns` page with Concerns + Categories tabs and modal editor with color picker + image preview.
- Product edit form: Niche dropdown + Category dropdown + multi-select Concern chips.

## Pending / Backlog

### P1
- Apply trust-card pattern to ProductDetailPage hero
- Filter `/` Anti-Aging home strictly to niche=anti-aging products in its own bestseller strip
- Real packaging photography for the 17 products (current images are Unsplash placeholders that occasionally include their own watermark text — replace via Admin → Products)
- Mobile bottom nav (Home / Shop / Categories / Account / Cart)

### P2
- Order Success page Meta Pixel + Google Ads conversion ID wiring
- Multi-product email confirmation template

### P3 — Growth
- Personalized "For You" home strip (last-viewed concerns from localStorage)
- Customer referral program
- Wishlist persistence
- Stock-out / Waitlist signup
- Subscribe & Save monthly auto-reorder

## Credentials
- Admin: password `celestaglow2024` at `/admin`
- Employees: `orderteam`/`VclhxCbJ`, `testadmin`/`TestPass123` at `/employee/login`

## Architecture
- React + FastAPI + MongoDB
- Brand color: `#22c55e` (Tailwind green-500)
- Niche accents: anti-aging mint-green, skincare cyan, cosmetics rose-pink

## Mocked / placeholder
- Razorpay test keys, SMTP credentials, Delhivery, WhatsApp, Emergent LLM key all use dummy values.
- Sample product/concern/category images are Unsplash placeholders.
