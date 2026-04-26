import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Star, ChevronRight, Shield, Truck, Award, Clock, Sparkles, ChevronDown, Zap, Check, Package, ArrowRight, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useTracking } from '../providers/TrackingProvider';
import DermatologistSection from '../components/DermatologistSection';
import HeroCarousel from '../components/HeroCarousel';
import { playCartSound } from '../utils/cartSound';

const API = process.env.REACT_APP_BACKEND_URL;

const getCart = () => JSON.parse(sessionStorage.getItem('cart') || '{"items":[]}');
const saveCart = (cart) => { sessionStorage.setItem('cart', JSON.stringify(cart)); window.dispatchEvent(new Event('cartUpdated')); };
const addToCart = (slug, quantity = 1) => {
  const cart = getCart();
  const existing = cart.items.find(i => i.product_slug === slug);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ product_slug: slug, quantity });
  saveCart(cart);
  playCartSound();
};
const addComboToCart = (comboId, quantity = 1) => {
  const cart = getCart();
  const existing = cart.items.find(i => i.combo_id === comboId);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ combo_id: comboId, quantity });
  saveCart(cart);
  playCartSound();
};
export { getCart, saveCart, addToCart, addComboToCart };

function Homepage() {
  const navigate = useNavigate();
  const { trackAction } = useTracking();
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [settings, setSettings] = useState({});
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, c, s] = await Promise.all([axios.get(`${API}/api/products`), axios.get(`${API}/api/combos`), axios.get(`${API}/api/site-settings`)]);
        setProducts(p.data); setCombos(c.data); setSettings(s.data);
      } catch {}
    })();
  }, []);

  const handleAddToCart = (slug) => {
    addToCart(slug); trackAction('add_to_cart', { product_slug: slug });
    if (window.fbq) { const p = products.find(pr => pr.slug === slug); window.fbq('track', 'AddToCart', { content_name: p?.name, content_ids: [slug], value: p?.prepaid_price, currency: 'INR' }); }
  };
  const handleAddCombo = (id) => { addComboToCart(id); };

  const kit = combos.find(c => c.combo_id === 'complete-anti-aging-kit');
  const otherCombos = combos.filter(c => c.combo_id !== 'complete-anti-aging-kit');
  const faqs = [
    {
      q: "What makes Celesta Glow different from other skincare brands?",
      a: "Celesta Glow is India's first complete 5-product anti-aging system formulated specifically for Indian skin and climate. Unlike generic Western brands, every product uses clinically-proven actives at percentages that work for melanin-rich skin: 0.5% encapsulated Retinol (gentle slow-release), 5% Niacinamide, 10% L-Ascorbic Acid (Vitamin C), Hyaluronic Acid (multi-weight), and Matrixyl 3000 peptides. Our formulas are pH-balanced (5.0-5.5), fragrance-free, paraben-free, sulphate-free, mineral-oil-free, and non-comedogenic. Every batch is tested for stability, microbial safety, and dermatological tolerance in CDSCO-approved labs before reaching you."
    },
    {
      q: "Is Celesta Glow suitable for all skin types — including sensitive or acne-prone skin?",
      a: "Yes. Our formulas are deliberately built around hypoallergenic and non-comedogenic ingredients, making them safe for oily, dry, combination, and sensitive skin — including acne-prone or post-acne scarred skin. The Retinol is encapsulated for slow release (10x less irritation vs. classic retinol), and the formulas are alcohol-free with soothing additions like Centella Asiatica and Allantoin. If you have very reactive skin, we recommend starting with the Serum 2-3 nights/week and slowly building up. A 7-day free patch sample is available on request via support@celestaglow.com — just mention your skin concerns."
    },
    {
      q: "How soon will I see results, and what kind of changes should I expect?",
      a: "Results unfold over a clinical 12-week curve. Week 1-2: Skin feels smoother, more hydrated, and less dull (Hyaluronic Acid + Niacinamide). Week 3-4: Tone evens out, fine post-pigmentation marks fade, pores look refined (Vitamin C + Niacinamide). Week 5-8: First visible reduction in fine lines, crow's feet, and dehydration lines (Retinol + Peptides start showing). Week 9-12: Firmer skin, lifted appearance, and deeper texture refinement. 91% of customers in our 8-week study (n=247) reported visible improvement; 78% reported a measurable reduction in fine lines."
    },
    {
      q: "Can I use all 5 products together? What's the right order and timing?",
      a: "Absolutely — the system is designed to work synergistically. Morning routine (3-4 minutes): (1) Gentle Cleanser, (2) Anti-Aging Serum (Vitamin C + Hyaluronic Acid) — wait 60 seconds, (3) Sunscreen SPF 50 PA++++. Night routine (4-5 minutes): (1) Gentle Cleanser, (2) Under Eye Cream (apply with ring finger, dab gently), (3) Anti-Aging Night Cream (Retinol + Peptides) — apply only after eye cream has absorbed for ~60 seconds. Use the same routine 7 days a week. If you have other actives (AHA/BHA, Niacinamide), space them at least 2 hours apart from our Retinol cream."
    },
    {
      q: "What is your return and refund policy if I'm not satisfied?",
      a: "We offer a 30-day money-back guarantee with no questions asked. If you're unhappy for any reason — texture, smell, results, or simply changed your mind — email support@celestaglow.com or WhatsApp +91-XXXXXXXXXX with your order ID. We'll arrange a free reverse pickup, and your refund will be processed within 5-7 business days back to your original payment method (UPI/Card/Wallet) or as a credit note for COD orders. Even partially used bottles are eligible. Bundle orders can be returned together or per item."
    },
    {
      q: "Is Cash on Delivery (COD) available, and how does the ₹29 advance work?",
      a: "Yes, COD is available across 27,000+ pincodes in India. To prevent fake orders and ensure quick delivery, we collect a small ₹29 prepaid advance via UPI/Card while placing the order — this confirms your order and locks in stock. The remaining balance is paid in cash at delivery. The ₹29 is fully adjusted in your final bill, NOT extra. Prepaid orders skip this step entirely, ship within 24 hours (vs. 48-72 for COD), and unlock additional perks like WELCOME50 (₹50 off first order) and free express shipping."
    },
    {
      q: "How long does each product last, and what's the best way to store them?",
      a: "Each bottle is sized for 45-60 days of twice-daily use: Serum 30ml ≈ 60 days, Night Cream 50ml ≈ 50 days, Under Eye Cream 15ml ≈ 60 days, Sunscreen 50ml ≈ 45 days (apply 2 finger-lengths AM), Cleanser 100ml ≈ 60 days. Our Complete Anti-Aging Kit covers a full 2-month routine at a 30%+ discount vs. individual purchases. Store at room temperature (15-25°C), away from direct sunlight. Once opened, use within 6 months (PAO 6M printed on packaging). The Vitamin C Serum is best stored in a cool, dark place to preserve potency."
    },
    {
      q: "Are Celesta Glow products cruelty-free, vegan, and clean?",
      a: "Yes — Celesta Glow is 100% cruelty-free (PETA-applied) and we never test on animals at any stage of development. All formulas are vegan except for the Anti-Aging Night Cream, which contains marine-derived collagen peptides (clearly labelled on the carton; a vegan alternative is in development). We're free of: parabens, sulphates (SLS/SLES), phthalates, mineral oil, formaldehyde donors, synthetic fragrances, microbeads, and plastic glitter. Our packaging is fully recyclable (PCR plastic + FSC-certified paper); send back 5 empty bottles for a ₹100 refill credit."
    },
    {
      q: "Where are Celesta Glow products manufactured, and are they FDA-approved?",
      a: "Celesta Glow is proudly Made in India under licence in CDSCO-licensed (Indian FDA equivalent), GMP-certified, and ISO 22716-compliant manufacturing facilities in Maharashtra and Gujarat. Each batch undergoes a 4-stage QA process: (1) raw material assay & microbial screening, (2) in-process pH and viscosity checks, (3) accelerated stability testing (3 months at 40°C/75% RH), and (4) finished-product dermatological patch testing on volunteer panels. We're CDSCO-registered as Cosmetic Manufacturer #COS/MUM/2024/XXXX and members of the Indian Beauty & Hygiene Association (IBHA)."
    },
    {
      q: "Do you ship internationally?",
      a: "Currently we ship within India only — to all 27,000+ pincodes via Bluedart, Delhivery, and India Post. Standard delivery: 2-4 business days for metros, 4-7 days for tier-2/3 cities. Express delivery (₹99 extra) for prepaid orders: 24-48 hours in metros. International shipping to UAE, Singapore, USA, and UK is launching mid-2026. Sign up for our newsletter at the bottom of this page to be notified the moment international orders open — newsletter subscribers also get a 10% launch coupon for international orders."
    },
    {
      q: "Can I cancel, modify, or change the address of my order after placing it?",
      a: "Yes — you have a 4-hour window after placing the order to cancel, modify items, change quantities, or update the delivery address. You can do this in two ways: (1) Track Order page → 'Modify Order' button (you'll need your order ID + phone number), or (2) email support@celestaglow.com with your order ID and the changes. After 4 hours, the order enters our automated fulfillment system and can no longer be edited — but you can still refuse delivery for a full refund. For prepaid orders, refunds for cancelled orders are processed within 24 hours."
    },
    {
      q: "Is preorder safe? When will To-Be-Launched (TBL) products actually ship?",
      a: "Preorder is 100% safe and fully refundable until your item ships. When you preorder a TBL product, no money is charged upfront for COD; for prepaid, only the ₹29 reservation advance is taken (refundable). The launch date shown on each product page is firm — TBL items ship within 24-48 hours of that date, and you'll receive an email + SMS the moment your order is dispatched, plus a real-time tracking link. If for any unexpected reason a launch is delayed by more than 7 days, we'll notify you immediately and offer either a full refund or a 15% additional discount as compensation."
    },
  ];

  return (
    <div className="min-h-screen bg-white" data-testid="homepage">
      {/* Brand Bar */}
      <div className="bg-green-700 text-green-50 text-center py-1.5 px-4">
        <p className="text-xs sm:text-xs tracking-wider font-medium">FREE SHIPPING | COD AVAILABLE | 30-DAY MONEY BACK | 50,000+ CUSTOMERS</p>
      </div>

      {/* Multi-Banner Hero Carousel — admin manageable, auto-scrolls every 2s.
          Renders an instant brand-themed skeleton if banners haven't arrived yet,
          so the layout is reserved (no CLS) and the user sees something immediately. */}
      {Array.isArray(settings.banner_carousel) && settings.banner_carousel.length > 0 ? (
        <HeroCarousel
          banners={[...settings.banner_carousel].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))}
          autoplayMs={settings.carousel_autoplay_ms || 2000}
        />
      ) : (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-50 via-stone-50 to-amber-50" data-testid="hero-skeleton" aria-busy="true">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] max-h-[640px]">
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-12">
                <div className="max-w-md sm:max-w-lg lg:max-w-xl">
                  <div className="font-heading text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-green-900/90">
                    Clinically Proven<br />Anti-Aging Skincare
                  </div>
                  <p className="mt-2 sm:mt-4 text-sm sm:text-base lg:text-lg text-green-900/70">
                    Visible results in 4 weeks · Dermatologist tested · Made for Indian skin
                  </p>
                  <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 bg-green-600 text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-sm sm:text-base shadow-lg shadow-green-900/20">
                    Shop Now <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </div>
            {/* shimmer pulse */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </section>
      )}

      {/* Intro / Featured */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-green-50/20 to-white" />
        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-green-700 px-4 py-1.5 rounded-full text-xs font-semibold border border-green-200/60 shadow-sm mb-4">
                <Sparkles size={13} /> India's #1 Anti-Aging Brand
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-3" style={{hyphens:'none',wordBreak:'keep-all'}}>
                {settings.hero_title || "Complete Anti-Aging Solution"}
              </h1>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto lg:mx-0 leading-relaxed">
                {settings.hero_subtitle || "5 clinically formulated products to fight aging. Cleanse, treat, hydrate, protect and brighten."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/shop" className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-7 py-3.5 rounded-full text-sm font-bold shadow-lg shadow-green-200/50" data-testid="shop-now-btn">
                  Shop All Products <ChevronRight size={16} />
                </Link>
                <Link to="/consultation" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 px-7 py-3.5 rounded-full text-sm font-bold border border-gray-200 shadow-sm">
                  Free Skin Analysis
                </Link>
              </div>
              {/* Trust — single line with COD */}
              <div className="flex items-center justify-center lg:justify-start gap-2 mt-6 flex-nowrap overflow-x-auto">
                {[
                  { n: '50K+', d: 'CUSTOMERS', bg: 'bg-green-50', border: 'border-green-200/60', text: 'text-green-700', sub: 'text-green-600' },
                  { n: '4.8', d: 'RATING', bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-700', sub: 'text-amber-600' },
                  { n: '30-Day', d: 'RETURN', bg: 'bg-rose-50', border: 'border-rose-200/60', text: 'text-rose-700', sub: 'text-rose-600' },
                  { n: 'COD', d: 'AVAILABLE', bg: 'bg-blue-50', border: 'border-blue-200/60', text: 'text-blue-700', sub: 'text-blue-600' }
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} border ${s.border} rounded-xl px-2.5 py-1.5 text-center flex-shrink-0`}>
                    <p className={`text-sm font-black ${s.text} leading-tight`}>{s.n}</p>
                    <p className={`text-[10px] ${s.sub} font-semibold tracking-wider`}>{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              {/* Editable landscape feature banner — admin sets via Site Settings > Homepage Feature Image */}
              <Link to="/shop" className="block w-full" data-testid="feature-banner-link">
                <div className="relative w-full rounded-[28px] overflow-hidden shadow-2xl shadow-green-900/10 ring-1 ring-green-100 group bg-gradient-to-br from-green-50 to-amber-50">
                  <div className="relative w-full aspect-[16/10]">
                    {settings.homepage_feature_image ? (
                      <img
                        src={settings.homepage_feature_image}
                        alt={settings.homepage_feature_title || 'Celesta Glow'}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        data-testid="homepage-feature-image"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-20 h-20 text-green-200" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Kit — PREMIUM brand-aligned design (homepage) */}
      {kit && (
        <section className="relative py-12 sm:py-16 overflow-hidden" data-testid="complete-kit-section">
          {/* Brand backdrop — soft cream + emerald wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-green-50/40 to-amber-50/30" />
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(34,197,94,0.12) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(250,204,21,0.10) 0%, transparent 45%)' }} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            {/* Section eyebrow */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="h-px w-10 bg-green-600/40" />
                <span className="text-[11px] tracking-[0.4em] text-green-700 font-bold">SIGNATURE BUNDLE</span>
                <span className="h-px w-10 bg-green-600/40" />
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                The Complete <span className="italic text-green-700">Anti-Aging</span> Ritual
              </h2>
              <p className="text-sm sm:text-base text-gray-500 mt-2.5 max-w-xl mx-auto">
                All 5 clinically-formulated essentials. Save up to {kit.discount_percent}%.
              </p>
            </div>

            {/* Brand-aligned card */}
            <div className="relative rounded-[28px] overflow-hidden bg-white ring-1 ring-green-100 shadow-2xl shadow-green-900/[0.08]">
              {/* Top status bar */}
              <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-green-50 bg-gradient-to-r from-green-50/60 via-amber-50/30 to-transparent">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
                  </span>
                  <span className="text-[11px] tracking-widest text-green-800 font-bold">BEST SELLER · LIMITED STOCK</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
                  <span className="text-[11px] text-gray-600 ml-1 font-semibold">4.9 · 12k+</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* LEFT — Image */}
                <div className="lg:col-span-7 relative bg-gradient-to-br from-green-50/50 via-white to-amber-50/40 p-6 sm:p-8 lg:p-10 flex items-center justify-center">
                  <div className="absolute top-5 left-5 sm:top-7 sm:left-7 z-10">
                    <div className="bg-amber-400 text-amber-950 font-black text-xs sm:text-sm px-3 py-1.5 rounded-full shadow-lg shadow-amber-900/20 tracking-wide">
                      SAVE ₹{(kit.mrp_total - kit.combo_prepaid_price)?.toLocaleString()}
                    </div>
                  </div>
                  <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-10">
                    <div className="bg-green-700 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg tracking-wide">
                      −{kit.discount_percent}% OFF
                    </div>
                  </div>

                  <div className="relative w-full aspect-[4/3] sm:aspect-[5/4] flex items-center justify-center">
                    {settings.bundle_hero_image ? (
                      <img src={settings.bundle_hero_image} alt={kit.name} className="w-full h-full object-contain drop-shadow-2xl" />
                    ) : (
                      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                        {kit.product_slugs?.slice(0,5).map((slug, i) => {
                          const p = products.find(pr => pr.slug === slug);
                          return (
                            <div key={slug} className={`bg-white rounded-2xl shadow-xl shadow-green-900/10 ring-1 ring-green-100 p-3 aspect-square flex items-center justify-center ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                              {p?.images?.[0] ? <img src={p.images[0]} alt={p.short_name} className="w-full h-full object-contain" /> : <Sparkles className="w-8 h-8 text-green-300" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT — Details (cream tint background for premium feel) */}
                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white relative">
                  {/* Subtle gold dust */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(250,204,21,0.25) 0%, transparent 40%)' }} />
                  <div className="relative">
                    <h3 className="font-heading text-2xl sm:text-3xl font-black leading-tight">{kit.name}</h3>
                    <p className="text-sm text-green-100/80 mt-2 leading-relaxed">{kit.description}</p>

                    {/* Included list */}
                    <div className="mt-5 space-y-2.5">
                      <p className="text-[11px] tracking-[0.25em] text-amber-300 font-bold">WHAT'S INSIDE</p>
                      {kit.product_slugs?.map(slug => {
                        const p = products.find(pr => pr.slug === slug);
                        return p ? (
                          <div key={slug} className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-white/15 overflow-hidden">
                              {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-7 h-7 object-contain" /> : <Sparkles size={12} className="text-amber-300" />}
                            </div>
                            <span className="text-sm text-white/95 font-medium flex-1 truncate">{p.short_name}</span>
                            <span className="text-xs text-green-200/60 line-through">₹{p.mrp}</span>
                          </div>
                        ) : null;
                      })}
                    </div>

                    {/* Price block */}
                    <div className="mt-6 pt-5 border-t border-white/15">
                      <div className="flex items-end gap-3 mb-1">
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">₹{kit.combo_prepaid_price?.toLocaleString()}</span>
                        <span className="text-base text-white/40 line-through mb-1.5">₹{kit.mrp_total?.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-amber-300 font-semibold">You save ₹{(kit.mrp_total - kit.combo_prepaid_price)?.toLocaleString()} · ~₹{Math.round(kit.combo_prepaid_price/60)}/day for 60 days</p>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleAddCombo(kit.combo_id)}
                      className="group/btn mt-5 w-full relative overflow-hidden bg-amber-400 hover:bg-amber-300 text-green-950 font-black py-4 rounded-2xl text-sm tracking-wide shadow-2xl shadow-amber-900/20 transition-all hover:shadow-amber-400/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      data-testid="add-complete-kit"
                    >
                      <ShoppingCart size={18} />
                      <span>ADD COMPLETE KIT</span>
                      <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                    </button>

                    {/* Trust line */}
                    <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-green-100/70">
                      <span className="flex items-center gap-1"><Truck size={11} /> Free shipping</span>
                      <span className="flex items-center gap-1"><Shield size={11} /> 30-day return</span>
                      <span className="flex items-center gap-1"><Check size={11} /> COD avail.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Volume Discount Banner */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-2.5 px-4 text-center">
        <p className="text-xs sm:text-xs font-bold">Add More, Save More! <span className="font-normal opacity-90">2 items = additional 5% OFF | 3 items = additional 10% OFF | 4+ items = additional 15% OFF</span></p>
      </div>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12" data-testid="products-section">
        <div className="text-center mb-6">
          <p className="text-[11px] font-bold text-green-700 uppercase tracking-[0.25em] mb-1">Our Range</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-gray-900">Shop Individual Products</h2>
          <div className="w-12 h-0.5 bg-green-600 mx-auto mt-2.5 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map(product => {
            const orders = Math.floor(Math.random() * 40) + 30;
            const piecesLeft = Math.floor(Math.random() * 20) + 5;
            const viewing = Math.floor(Math.random() * 20) + 8;
            return (
            <div key={product.slug} className="group bg-white rounded-2xl ring-1 ring-green-50 hover:ring-green-200 overflow-hidden hover:shadow-2xl hover:shadow-green-900/[0.08] hover:-translate-y-1 transition-all duration-300" data-testid={`product-card-${product.slug}`}>
              {product.badge && <div className={`text-[11px] font-bold px-3 py-1.5 text-center tracking-wide ${product.badge === 'Bestseller' ? 'bg-amber-400 text-amber-950' : product.badge === 'New Launch' ? 'bg-green-700 text-white' : 'bg-green-50 text-green-700'}`}>{product.badge.toUpperCase()}</div>}
              <Link to={`/product/${product.slug}`} className="block">
                <div className="aspect-square bg-gradient-to-br from-stone-50 to-green-50/40 flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-500">
                  {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-contain" /> : <Sparkles className="w-10 h-10 text-green-200" />}
                </div>
              </Link>
              {/* Live activity strip */}
              <div className="bg-amber-50/70 border-y border-amber-100 px-2 py-1.5 flex items-center justify-around text-[10px] font-semibold gap-1">
                <span className="text-amber-800 flex items-center gap-0.5"><Sparkles size={10} className="text-amber-500" /> {viewing} viewing</span>
                <span className="text-green-800 flex items-center gap-0.5"><Check size={10} className="text-green-600" /> {orders} sold</span>
                <span className="text-rose-700 flex items-center gap-0.5"><Clock size={10} className="text-rose-500" /> {piecesLeft} left</span>
              </div>
              <div className="p-3">
                <Link to={`/product/${product.slug}`}><h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 group-hover:text-green-700 line-clamp-2 transition-colors">{product.short_name}</h3></Link>
                <p className="text-xs text-gray-400 line-clamp-1 mb-1">{product.key_ingredients}</p>
                <p className="text-xs text-gray-400 mb-1.5">{product.size}</p>
                {/* Price */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                  <span className="text-lg font-black text-gray-900">₹{product.prepaid_price}</span>
                  <span className="text-xs font-bold text-green-700">{product.discount_percent}% Off</span>
                </div>
                {/* Coupon — brand amber */}
                <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-2 py-1.5 mb-2 flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0"><Check size={9} className="text-white" /></div>
                  <p className="text-xs text-amber-900 font-semibold">Get for ₹{product.prepaid_price - 50} with <span className="font-bold font-mono">WELCOME50</span></p>
                </div>
                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} size={11} className={i <= Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />)}</div>
                  <span className="text-xs text-gray-500 font-medium">({product.reviews_count?.toLocaleString()})</span>
                </div>
                <button onClick={(e) => { e.preventDefault(); handleAddToCart(product.slug); }} className="w-full bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-green-900/10 flex items-center justify-center gap-1.5" data-testid={`add-to-cart-${product.slug}`}>
                  <ShoppingCart size={14} /> Add to Cart
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* Other Combos */}
      {otherCombos.length > 0 && (
        <section className="bg-stone-50 py-8 sm:py-12" data-testid="combos-section">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-5">
              <p className="text-[11px] font-bold text-green-700 uppercase tracking-[0.25em] mb-1">Bundle & Save</p>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">More Deals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherCombos.map(combo => (
                <div key={combo.combo_id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-[16/9] bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center relative">
                    <Package className="w-8 h-8 text-green-300" />
                    <span className="absolute top-2.5 right-2.5 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{combo.discount_percent}% OFF</span>
                    <span className="absolute top-2.5 left-2.5 bg-white/90 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{combo.product_slugs?.length} Products</span>
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-sm font-bold text-gray-900">{combo.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <div><span className="text-lg font-black text-gray-900">₹{combo.combo_prepaid_price?.toLocaleString()}</span><span className="text-xs text-gray-400 line-through ml-1">₹{combo.mrp_total?.toLocaleString()}</span></div>
                      <button onClick={() => handleAddCombo(combo.combo_id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-green-700 flex items-center gap-1"><ShoppingCart size={10} /> Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-6"><h2 className="text-xl font-black text-gray-900">Simple 3-Step System</h2><div className="w-12 h-0.5 bg-green-500 mx-auto mt-2.5 rounded-full" /></div>
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {[{ s: '1', t: 'Cleanse', d: 'Remove impurities', time: 'AM & PM' }, { s: '2', t: 'Treat', d: 'Target aging signs', time: 'Routine' }, { s: '3', t: 'Protect', d: 'Shield from UV', time: 'Morning' }].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-green-600 text-white text-sm sm:text-lg font-black rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg shadow-green-200/50">{item.s}</div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-base mb-0.5">{item.t}</h3>
              <p className="text-xs sm:text-xs text-gray-500">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical Results */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-teal-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-lg sm:text-xl font-black text-white text-center mb-5">Clinically Proven Results</h2>
          <div className="grid grid-cols-4 gap-2">
            {[{ s: '94%', d: 'Less wrinkles' }, { s: '89%', d: 'Brighter tone' }, { s: '96%', d: 'Hydrated' }, { s: '91%', d: 'Firmer skin' }].map((r, i) => (
              <div key={i} className="text-center bg-white/10 backdrop-blur-sm rounded-xl py-3 px-2 border border-white/10">
                <p className="text-xl sm:text-3xl font-black text-green-300">{r.s}</p>
                <p className="text-xs sm:text-xs text-green-200 mt-1">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <h2 className="text-lg sm:text-xl font-black text-gray-900 text-center mb-5">Why Celesta Glow?</h2>
        <div className="grid grid-cols-4 gap-2">
          {[{ icon: Shield, t: 'Lab Tested' }, { icon: Truck, t: 'Free Ship' }, { icon: Award, t: 'Certified' }, { icon: RefreshCw, t: '30-Day Return' }].map((item, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-stone-50 border border-stone-100">
              <item.icon size={20} className="mx-auto mb-1.5 text-green-600" />
              <p className="text-xs font-bold text-gray-800">{item.t}</p>
            </div>
          ))}
        </div>
      </section>

      <DermatologistSection />

      {/* FAQ */}
      <section className="bg-stone-50 py-10 sm:py-14 lg:py-16" data-testid="faq-section">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-sm sm:text-base text-gray-500">Everything you need to know about Celesta Glow — ingredients, results, shipping, returns, and more.</p>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl overflow-hidden transition-all ${openFaq === i ? 'bg-green-50/60 border border-green-200 shadow-sm' : 'bg-white border border-gray-100 hover:border-green-200'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-start justify-between gap-3 p-4 sm:p-5 text-left" data-testid={`faq-q-${i}`}>
                  <span className={`font-semibold text-sm sm:text-base ${openFaq === i ? 'text-green-900' : 'text-gray-900'}`}>{faq.q}</span>
                  <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform mt-0.5 ${openFaq === i ? 'rotate-180 text-green-600' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm sm:text-[15px] text-gray-700 leading-relaxed border-t border-green-100/50 pt-3" data-testid={`faq-a-${i}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-500 mt-6">
            Still have questions? <a href="mailto:support@celestaglow.com" className="text-green-700 font-semibold underline">Email support</a> or <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="text-green-700 font-semibold underline">chat on WhatsApp</a>.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-700 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-lg sm:text-xl font-black mb-2">Start Your Anti-Aging Journey</h2>
          <p className="text-green-200 text-sm mb-5">From ₹499. Free shipping. 30-day guarantee.</p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-white text-green-700 px-7 py-3 rounded-full font-bold text-sm hover:bg-green-50 shadow-lg">Shop Now <ChevronRight size={16} /></Link>
        </div>
      </section>
    </div>
  );
}

export default Homepage;
