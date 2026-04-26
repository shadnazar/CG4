# Celesta Glow PRD

## Latest Update: April 26, 2026 — Categories / Routine / Account redesign

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
