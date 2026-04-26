# Celesta Glow PRD

## Latest Update: April 26, 2026 — Search autocomplete + circular strips back + categories redesign

### What's New (this iteration)
1. **`<SearchBar>` upgraded with niche-scoped autocomplete**:
   - Pass `niche="anti-aging" | "skincare" | "cosmetics"` and the input filters live to that niche only.
   - As-you-type suggestion dropdown (top 6) showing thumbnail + name + ingredient + price; click to navigate to product, Enter to see full results.
   - 5-min in-memory cache, keyboard arrow navigation, Esc to close.
   - Mobile-safe `fontSize: 16px` (no iOS zoom), `autoComplete="off"`.
2. **Circular concern/category strips brought back** below the search bar on the niche pages:
   - `/skincare` → "Pick your skin problem" strip (concerns)
   - `/cosmetics` → "Lip · Eye · Brow · Face" strip (categories)
   - `/` (Anti-Aging) → no strip (per requirement)
3. **Niche hero `<NicheHero>` now accepts `mobileBgImage`**: smaller, tighter mobile crop with no wasted vertical space (mobile aspect/height tightened, padding reduced).
   - Anti-Aging mobile uses a clean wide cream/serum shot
   - Skincare mobile uses a clean wide skincare shot
   - Cosmetics mobile = unchanged (user said it was good)
4. **Niche card icons fixed** — `NicheCardSwitcher` reverted to code-rendered design so the icon top-right always matches the niche label:
   - Anti-Aging → `Sparkles`
   - Skincare → `Droplet`
   - Cosmetics → `Palette` (was `Lock`, now correct)
5. **`/categories` page redesigned** — single-scroll mobile-first:
   - No pill switcher, no icons
   - 3 stacked sections (Anti-Aging products → Skincare categories → Cosmetics categories)
   - Each section: niche-color tagline + heading + "View all" link + 4-col image-circle grid
   - One unified search input filters all 3 sections live
6. **Routine page** — added optional **selfie upload** tile with **client-side image compression** (max 720px wide, JPEG q=0.72) to keep payloads tiny and prevent giant phone-camera files from slowing the page.

### Three-Niche Structure
1. **Anti-Aging** (`/`) — emerald
2. **Skincare** (`/skincare`) — cyan
3. **Cosmetics & Makeup** (`/cosmetics`) — rose

### Backend
- Collections: `niches`, `concerns`, `categories`, `products`, `combos`
- 17 products + 21 active categories (4 deactivated dupes hidden) + 8 concerns + 3 niches + 4 combos
- API: `GET /api/niches`, `/api/concerns(/:slug)`, `/api/categories(/:slug)` (active only), `/api/products?niche=&category=&concern=`
- Order tracking: `POST /api/track-order { phone }`
- Admin: `/admin` → password `celestaglow2024`

## Pending / Backlog

### P1
- **Cosmetics niche page banner** (user will provide their own artwork later — currently a placeholder Unsplash shot)
- Wire real backend auth for `/account` — `/api/customers/login` with bcrypt + JWT
- Wire **real AI** for routine generation + selfie analysis using Emergent LLM key (currently the routine pick is a category-slot simulation, selfie is captured but not analyzed)
- Real packaging photography for the 17 products
- Re-introduce FAQ accordion as a footer-shared block

### P2
- Order Success page Meta Pixel + Google Ads conversion ID wiring
- `/category/:slug` graceful empty state for all 21 active categories
- Product detail page: product card variant matching the bestsellers grid

### P3 — Growth
- "For You" personalized strip
- Customer referral program
- Wishlist persistence
- Subscribe & Save monthly auto-reorder
- Save-routine-as-PDF (skin prescription card)

## Credentials
- Admin: password `celestaglow2024` at `/admin`
- Employees: `orderteam`/`VclhxCbJ`, `testadmin`/`TestPass123` at `/employee/login`
- Customer account (`/account`): any 10-digit phone + 4+ char password (lightweight client session)

## Architecture
- React 19 + FastAPI + MongoDB
- Brand color: `#22c55e` (green-500); niche accents — emerald (anti-aging), cyan (skincare), rose (cosmetics)

## Mocked / placeholder
- Razorpay test keys, SMTP, Delhivery, WhatsApp, EMERGENT_LLM_KEY — **MOCKED** dummy values in `/app/backend/.env`
- Routine generation is **MOCKED** category-pick simulation (no real AI yet)
- Selfie upload is captured + compressed but **NOT sent anywhere** (no analysis backend yet)
- Account auth is **CLIENT-SIDE ONLY** (localStorage)
- Cosmetics niche page banner is a **placeholder** Unsplash image until user provides theirs
- Mobile banner images for Anti-Aging & Skincare are stock Unsplash crops — replace with branded artwork when available
- Product images are mostly Unsplash placeholders

### What's New (this iteration)
1. **New `<NicheHero>` component** — single banner card with the full-bleed user-provided artwork as the background and the text content (eyebrow chip → big italic title → subtitle → 2 pill CTAs) overlaid on the LEFT half. White-fade gradient overlay ensures legibility on top of any artwork. Used identically across all 3 niche pages.
2. **All 3 niche pages now share an identical 5-section structure**:
   - Search bar
   - `<NicheHero>` banner
   - `<TrustStrip>` (4 trust pillars)
   - Bestsellers grid (same `<ProductCard>`, niche-filtered)
   - Routine-builder CTA card
   (Anti-Aging adds the Complete Kit flagship section between bestsellers and CTA.)
3. **Anti-Aging Homepage redesigned** from scratch — removed the old multi-banner carousel, intro hero, FAQ, clinical results, etc. Now matches Skincare/Cosmetics structure exactly. Banner uses the user-provided `Age Reset Cream` artwork.
4. **Skincare Homepage** now uses banner-as-background `Daily Defense Sunscreen` artwork.
5. **Cosmetics Homepage** uses placeholder banner (user will swap in their own artwork later).
6. **Categories de-duplicated** — `concerns_seed.deactivate_legacy_cosmetics_dupes` migration deactivates legacy generic cosmetics categories (`cosmetics-makeup`, `lipstick`, `eye-makeup`, `face-makeup`) and remaps any products from those slugs to the more specific new ones. Cosmetics list dropped from 16 → 12 clean unique sub-categories.

### Earlier this session
- New `/categories`, `/routine`, `/account` pages
- Mobile bottom nav: Home / Categories / Routine / Account / Cart
- 15 new sub-categories seeded in `concerns_seed.py`

### Three-Niche Structure (unchanged routes)
1. **Anti-Aging** (`/`) — green/emerald
2. **Skincare** (`/skincare`) — cyan
3. **Cosmetics & Makeup** (`/cosmetics`) — rose

### Backend
- Collections: `niches`, `concerns`, `categories`, `products`, `combos`
- 17 products + 21 active categories (4 deactivated dupes hidden) + 8 concerns + 3 niches + 4 combos
- API: `GET /api/niches`, `/api/concerns(/:slug)`, `/api/categories(/:slug)` (active only), `/api/products?niche=&category=&concern=`
- Order tracking: `POST /api/track-order { phone }`
- Admin: `/admin` → password `celestaglow2024` + `X-Admin-Token` header

## Pending / Backlog

### P1
- **Cosmetics banner image** (user will provide later)
- Wire real backend auth for `/account` — `/api/customers/login` with bcrypt + JWT
- Replace simulated routine pick with real Emergent LLM call when a real key is set
- Re-introduce FAQ accordion as a footer-shared block across all 3 niche pages
- Real packaging photography for the 17 products

### P2
- Order Success page Meta Pixel + Google Ads conversion ID wiring
- Multi-product email confirmation template
- `/category/:slug` pages for all 21 active categories — verify graceful empty state when 0 products

### P3 — Growth
- Personalized "For You" home strip
- Customer referral program
- Wishlist persistence
- Subscribe & Save monthly auto-reorder

## Credentials
- Admin: password `celestaglow2024` at `/admin`
- Employees: `orderteam`/`VclhxCbJ`, `testadmin`/`TestPass123` at `/employee/login`
- Customer account (`/account`): any 10-digit phone + 4+ char password (lightweight client session)

## Architecture
- React 19 + FastAPI + MongoDB
- Brand color: `#22c55e` (green-500); niche accents — emerald (anti-aging), cyan (skincare), rose (cosmetics)

## Mocked / placeholder
- Razorpay test keys, SMTP, Delhivery, WhatsApp, EMERGENT_LLM_KEY — **MOCKED** dummy values in `/app/backend/.env`
- Routine generation is **MOCKED** category-pick simulation, not a real LLM call
- Account auth is **CLIENT-SIDE ONLY** (localStorage)
- Cosmetics niche page banner is a **placeholder** Unsplash image until user provides theirs
- Product images are mostly Unsplash placeholders

### What's New (this iteration)
1. **Niche cards** on niche-home pages (`/`, `/skincare`, `/cosmetics`) replaced with user-supplied artwork (full-bleed JPEG with title/icon/arrow baked in).
2. **Mobile bottom nav** redesigned: **Home → Categories → Routine → Account → Cart** with proper routes.
3. **NEW page `/categories`** — Amazon-style mobile-first taxonomy hub:
   - Sticky pill switcher (3 niches) + search bar
   - Niche-themed banner header
   - 4-column circular subcategory grid that swaps per niche
   - Anti-Aging tab → 5 flagship products as circles
   - Skincare tab → 9 sub-categories (Cleansers, Serums, Moisturizers, Sunscreens, Eye Care, Facewash & Scrubs, Toner, Body Lotion, Lip Balms)
   - Cosmetics tab → 13 sub-categories (Lipstick, Eye Makeup, Brow, Face Makeup, Kajal & Eyeliner, Blush & Highlighters, Lipsticks & Glosses, Eyeshadows, Foundations & Concealers, Primers & Compacts, Nails & Accessories, Makeup Kits, Brushes, Fixers, Removers)
4. **NEW page `/routine`** — Futuristic dark/glow AI-routine builder:
   - Skin type, age band, top concerns selectors (1–3)
   - Single "Generate My Routine" CTA → 1.6s simulated AI pick
   - Output: AM (Cleanse → Treat → Moisturize → Protect) + PM (Cleanse → Eye Care → Treat → Night Cream)
   - Each step links to the matched product
5. **NEW page `/account`** — Customer login & order tracking:
   - Sign-up / sign-in via 10-digit phone + password (+ optional email)
   - Lightweight client-side session (localStorage) — phone is the primary identifier
   - Once signed in: profile header (phone/email), live "My Orders" list pulled from `POST /api/track-order` with status pills (delivered/cancelled/processing)
   - Quick links: Track Order, Help & Support
6. **Backend** — `concerns_seed.py` extended with **15 new categories** (idempotent upsert on every restart). Total categories: 25.
7. **Niche page banners**:
   - `/` (Anti-Aging) → fallback feature image now uses `Celesta Glow Age Reset Cream` artwork
   - `/skincare` → hero image replaced with `Celesta Glow Daily Defense Sunscreen` artwork
   - `/cosmetics` → user will provide banner; current Pinterest-style 3-image grid kept

### Three-Niche Structure (unchanged)
1. **Anti-Aging** (`/`) — flagship Celesta Glow brand line
2. **Skincare** (`/skincare`) — cyan-themed niche home
3. **Cosmetics & Makeup** (`/cosmetics`) — rose-themed niche home

### Backend
- Collections: `niches`, `concerns`, `categories`, `products`
- 17 products + 25 categories + 8 concerns + 3 niches
- API: `GET /api/niches`, `/api/concerns(/:slug)`, `/api/categories(/:slug)`, `/api/products?niche=&category=&concern=`
- Order tracking: `POST /api/track-order { phone }` returns `{ orders: [...] }`
- Admin: `/admin` → password `celestaglow2024`, X-Admin-Token header

## Pending / Backlog

### P1
- Cosmetics banner image (user will provide later)
- Wire real backend auth for `/account` (currently client-side localStorage session). Recommend `/api/customers/login` using bcrypt + JWT
- Replace simulated routine pick with a real Emergent LLM call (`services/ai_skin_analyzer.py`) once a real EMERGENT_LLM_KEY is set
- Real packaging photography for the 17 products
- Apply trust-card pattern to ProductDetailPage hero

### P2
- Order Success page Meta Pixel + Google Ads conversion ID wiring
- Multi-product email confirmation template
- Sub-category pages (`/category/:slug`) auto-filter products by category — already wired but need to verify all 15 new sub-cats render gracefully even with 0 products

### P3 — Growth
- Personalized "For You" home strip (last-viewed concerns)
- Customer referral program
- Wishlist persistence
- Subscribe & Save monthly auto-reorder

## Credentials
- Admin: password `celestaglow2024` at `/admin`
- Employees: `orderteam`/`VclhxCbJ`, `testadmin`/`TestPass123` at `/employee/login`
- Customer account (`/account`): any 10-digit phone + 4+ char password (lightweight client session)

## Architecture
- React 19 + FastAPI + MongoDB
- Brand color: `#22c55e` (green-500); niche accents — emerald (anti-aging), cyan (skincare), rose (cosmetics)

## Mocked / placeholder
- Razorpay test keys, SMTP, Delhivery, WhatsApp, EMERGENT_LLM_KEY all use **MOCKED** dummy values in `/app/backend/.env`
- Routine generation is a **MOCKED** category-pick simulation, not a real LLM call
- Account auth is **CLIENT-SIDE ONLY** (localStorage), no backend verification yet
- Product images are mostly Unsplash placeholders
