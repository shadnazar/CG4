import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ChevronRight, Flame, Sparkles, ShoppingCart, Star, Truck, Shield, Check } from 'lucide-react';
import { useTracking } from '../providers/TrackingProvider';
import SearchBar from '../components/SearchBar';
import TrustStrip from '../components/TrustStrip';
import NicheHero from '../components/NicheHero';
import { ProductCard } from './ConcernCategoryPage';
import { playCartSound } from '../utils/cartSound';

const API = process.env.REACT_APP_BACKEND_URL;
const ACCENT = '#0f766e';
const ACCENT_DARK = '#115e59';
const ACCENT_BG = '#d1fae5';

const BANNER_IMG = 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/uscaqcsg_217BA6A6-1F87-44A3-AD2C-F750B48A11EF.png';
/* Mobile-only tighter crop (clean wide cream/serum shot) */
const BANNER_IMG_MOBILE = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80';

/* ---- Cart helpers (preserved API for the rest of the app) ---- */
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

/**
 * Homepage (Anti-Aging niche home for `/`).
 * Simplified to match Skincare/Cosmetics niche pages:
 *  1. Search bar
 *  2. Hero banner (image-as-background, text overlay left)
 *  3. Trust strip
 *  4. Anti-Aging bestsellers grid
 *  5. Complete Kit (flagship offer)
 *  6. CTA card
 */
function Homepage() {
  const { trackAction } = useTracking();
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/products?niche=anti-aging`),
      axios.get(`${API}/api/combos`),
    ])
      .then(([p, c]) => { setProducts(p.data || []); setCombos(c.data || []); })
      .finally(() => setLoading(false));
  }, []);

  const bestsellers = useMemo(
    () => [...products].sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0)).slice(0, 10),
    [products]
  );

  const kit = combos.find(c => c.combo_id === 'complete-anti-aging-kit');

  const handleAddCombo = (id) => { addComboToCart(id); trackAction('add_combo', { combo_id: id }); };

  return (
    <div className="bg-stone-50/40" data-testid="homepage">
      <SearchBar accent={ACCENT} niche="anti-aging" testId="anti-aging-search-bar" />

      <NicheHero
        bgImage={BANNER_IMG}
        mobileBgImage={BANNER_IMG_MOBILE}
        eyebrow="Anti-Aging Niche"
        eyebrowDot={ACCENT}
        eyebrowText={ACCENT_DARK}
        title={<>Visible firming<br/><span className="italic font-light" style={{ color: ACCENT_DARK }}>&amp; youthful glow.</span></>}
        subtitle="Clinical-grade Retinol, Vitamin C and Peptides — formulated for Indian skin to reduce fine lines and brighten in 4 weeks."
        cta1={{ label: 'Shop the routine', to: '/categories' }}
        cta2={{ label: 'Free Skin Analysis', to: '/skin-analysis' }}
        accent={ACCENT}
        accentDark={ACCENT_DARK}
        testId="anti-aging-hero"
      />

      <div className="pt-5 sm:pt-7">
        <TrustStrip accent={ACCENT} accentBg={ACCENT_BG} />
      </div>

      {/* Complete Kit — flagship single-card offer (moved BEFORE bestsellers) */}
      {kit && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 sm:pt-10" data-testid="complete-kit-section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-12">
              <div className="relative bg-white rounded-2xl sm:rounded-3xl ring-1 ring-emerald-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
                {/* Single image */}
                <div className="relative sm:w-[42%] aspect-[4/3] sm:aspect-auto bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 flex items-center justify-center p-5 sm:p-7">
                  <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-full shadow-md tracking-wide">
                    SAVE ₹{(kit.mrp_total - kit.combo_prepaid_price)?.toLocaleString()}
                  </span>
                  {(kit.image || products.find(pr => pr.slug === kit.product_slugs?.[0])?.images?.[0]) ? (
                    <img
                      src={kit.image || products.find(pr => pr.slug === kit.product_slugs?.[0])?.images?.[0]}
                      alt={kit.name}
                      className="max-h-full max-w-full object-contain drop-shadow-xl"
                      data-testid="complete-kit-image"
                    />
                  ) : (
                    <Sparkles className="w-14 h-14 text-emerald-200" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 p-5 sm:p-7 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-1.5 self-start bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-1 rounded-full mb-3">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-emerald-800 uppercase">Signature Bundle</span>
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-stone-900 mb-2">{kit.name}</h3>
                  <p className="text-xs sm:text-sm text-stone-600 mb-3 leading-relaxed line-clamp-2">{kit.description}</p>
                  <div className="flex items-center gap-1.5 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                    <span className="text-[11px] text-stone-500 ml-1 font-semibold">4.9 · 12k+ reviews</span>
                  </div>
                  <div className="flex items-end gap-2.5 mb-4">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900">₹{kit.combo_prepaid_price?.toLocaleString()}</span>
                    <span className="text-sm text-stone-400 line-through mb-1">₹{kit.mrp_total?.toLocaleString()}</span>
                    <span className="text-[10px] font-black tracking-wider bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">−{kit.discount_percent}% OFF</span>
                  </div>
                  <button
                    onClick={() => handleAddCombo(kit.combo_id)}
                    data-testid="add-complete-kit"
                    className="group/btn w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-6 rounded-full text-sm tracking-wide shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} /> Add Complete Kit <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                  </button>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1"><Truck size={11} /> Free shipping</span>
                    <span className="flex items-center gap-1"><Shield size={11} /> 30-day return</span>
                    <span className="flex items-center gap-1"><Check size={11} /> COD avail.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers — same product card as Skincare/Cosmetics */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex items-end justify-between mb-4 sm:mb-6 px-1 sm:px-0">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.4em] uppercase mb-1 sm:mb-1.5 flex items-center gap-2" style={{ color: ACCENT }}>
              <Flame size={11} style={{ fill: ACCENT, color: ACCENT }} /> Trending now
            </p>
            <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">
              Anti-Aging <span className="italic" style={{ color: ACCENT }}>Bestsellers</span>
            </h2>
          </div>
          <Link to="/shop" className="text-[11px] sm:text-xs font-bold flex items-center gap-1 hover:underline" style={{ color: ACCENT }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="aspect-[3/5] bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl" />)}
          </div>
        ) : bestsellers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500 ring-1 ring-emerald-100">No bestsellers yet — check back soon.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {bestsellers.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </section>

      {/* Customer reviews — anti-aging only */}
      <ReviewsSection accent={ACCENT} accentDark={ACCENT_DARK} />

      {/* Dermatologist section — anti-aging only */}
      <DermatologistSection />

      {/* FAQ — anti-aging only */}
      <FaqSection accent={ACCENT} accentDark={ACCENT_DARK} />

      {/* Routine CTA */}
      <section className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, white 0%, transparent 50%), radial-gradient(circle at 15% 85%, white 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
          <p className="text-[10px] sm:text-[11px] font-black tracking-[0.4em] text-emerald-200 uppercase mb-2">Build your routine</p>
          <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2">Not sure where to start?</h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto mb-4 sm:mb-5">Tell us your skin type — we'll build a personalized AM &amp; PM ritual in 2 seconds.</p>
          <Link to="/routine" className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-900 px-5 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-2xl hover:-translate-y-0.5 transition-all">
            <Sparkles size={13} className="text-emerald-700" /> Start Routine Builder <ChevronRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Homepage;

/* ===================== Anti-Aging-only sections ===================== */

import { Quote, ChevronDown, BadgeCheck } from 'lucide-react';

function ReviewsSection({ accent, accentDark }) {
  const reviews = [
    { name: 'Priya S.', age: '32', city: 'Bengaluru', rating: 5, days: 28, body: 'I noticed a real change in my fine lines around the eyes after 4 weeks. Skin feels firmer and looks visibly brighter every morning.', verified: true, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' },
    { name: 'Riya M.',   age: '38', city: 'Mumbai',    rating: 5, days: 42, body: 'My dermat recommended retinol and Celesta Glow was the only one my sensitive skin tolerated. No purging, just glow.', verified: true, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80' },
    { name: 'Anjali K.', age: '45', city: 'Delhi',     rating: 5, days: 60, body: 'At 45, I had stopped expecting visible changes. Six weeks in, my husband actually noticed. That says everything.', verified: true, image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
    { name: 'Sneha R.',  age: '29', city: 'Hyderabad', rating: 5, days: 21, body: 'The Vitamin C serum is hands down the best I have used. Pigmentation around my mouth has faded so much.', verified: true, image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80' },
  ];
  return (
    <section className="bg-white py-8 sm:py-12" data-testid="anti-aging-reviews">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.4em] uppercase mb-1 sm:mb-1.5" style={{ color: accent }}>Real customers · Real results</p>
            <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">
              What our <span className="italic" style={{ color: accent }}>community</span> says
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
            <span className="text-xs text-stone-600 font-bold ml-1">4.9 / 5 · 12,400+</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {reviews.map(r => (
            <div key={r.name} className="relative bg-gradient-to-br from-stone-50 to-white rounded-2xl ring-1 ring-stone-200 p-4 sm:p-5 hover:shadow-md transition-all" data-testid={`review-${r.name}`}>
              <Quote size={26} className="absolute top-3 right-3 text-stone-200" />
              <div className="flex items-center gap-3 mb-3">
                <img src={r.image} alt={r.name} loading="lazy" className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-stone-900 flex items-center gap-1 truncate">{r.name} <span className="text-stone-400 font-medium">· {r.age}</span></p>
                  <p className="text-[11px] text-stone-500">{r.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-[13px] leading-relaxed text-stone-700">"{r.body}"</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase" style={{ color: accentDark }}>
                {r.verified && <span className="inline-flex items-center gap-1"><BadgeCheck size={11} /> Verified</span>}
                <span className="text-stone-400">·</span>
                <span className="text-stone-500">{r.days}-day result</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DermatologistSection() {
  return (
    <section className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 py-8 sm:py-12" data-testid="anti-aging-dermat">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl ring-1 ring-emerald-100 p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          <div className="lg:col-span-5">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
              <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=80" alt="Dermatologist consulting" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.4em] uppercase text-emerald-700 mb-1.5 flex items-center gap-2">
              <BadgeCheck size={12} className="text-emerald-700" /> Dermatologically formulated
            </p>
            <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-stone-900 mb-3">
              Built with <span className="italic text-emerald-700">board-certified dermatologists</span> for Indian skin.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-5">
              Every formulation goes through a 3-stage review with dermatology experts who specialize in tropical-climate skin — so the actives that *should* irritate Indian skin (retinol, Vit-C, AHAs) actually work without flushing, peeling or post-inflammatory pigmentation.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { num: '4', label: 'Weeks to visible firming' },
                { num: '0', label: 'Parabens · Sulfates · Mineral oil' },
                { num: '98%', label: 'Reported softer skin in 30 days' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-emerald-50/60 ring-1 ring-emerald-100">
                  <div className="font-heading text-2xl sm:text-3xl font-black text-emerald-800 leading-none">{s.num}</div>
                  <p className="text-[10px] text-emerald-900/70 mt-1.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <Link to="/consultation" className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-5 rounded-full text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-900/15 transition-all hover:-translate-y-0.5">
              Book free dermat consult <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a, defaultOpen, accent }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="bg-white rounded-2xl ring-1 ring-stone-200 overflow-hidden" data-testid={`faq-item-${q.slice(0,16).toLowerCase().replace(/\s+/g,'-')}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left hover:bg-stone-50/60 transition-colors">
        <span className="text-sm sm:text-base font-bold text-stone-900 leading-snug">{q}</span>
        <ChevronDown size={18} className={`flex-shrink-0 text-stone-500 transition-transform ${open ? 'rotate-180' : ''}`} style={open ? { color: accent } : undefined} />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 text-[13px] sm:text-sm text-stone-600 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

function FaqSection({ accent, accentDark }) {
  const faqs = [
    { q: 'How quickly will I see results from the Anti-Aging Kit?', a: 'Most users notice softer skin and a brighter complexion within 7–10 days. Visible firming and reduction in fine lines typically appear at 4 weeks of consistent AM + PM use.' },
    { q: 'Is retinol safe for Indian skin? Will it cause irritation?', a: 'Our retinol is encapsulated in a slow-release matrix specifically tested on melanin-rich, tropical skin types. It releases over 8 hours which dramatically reduces flushing, peeling and post-inflammatory pigmentation common with conventional retinols.' },
    { q: 'Can I use the Vitamin C serum and retinol together?', a: 'Yes — but apply Vitamin C in the AM (it pairs beautifully with sunscreen) and retinol at PM. Stacking both at the same time can over-exfoliate sensitive skin.' },
    { q: 'Are the products dermatologically tested?', a: 'Every formula passes a 3-stage review with board-certified dermatologists, plus independent lab testing for safety, efficacy and shelf stability under Indian climate conditions.' },
    { q: 'What if it doesn\'t work for me?', a: 'We offer a 30-day no-questions-asked money-back guarantee. If you don\'t see results, message us on WhatsApp and we\'ll process a full refund.' },
    { q: 'How is shipping & delivery?', a: 'Free shipping on orders over ₹499. Most metros receive their order within 2–3 business days. We also offer Cash on Delivery and 24-hour dispatch.' },
  ];
  return (
    <section className="bg-white py-8 sm:py-12" data-testid="anti-aging-faq">
      <div className="max-w-3xl mx-auto px-3 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.4em] uppercase mb-1.5" style={{ color: accent }}>Frequently asked</p>
          <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 leading-tight">
            Got <span className="italic" style={{ color: accent }}>questions?</span>
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} accent={accent} />)}
        </div>
      </div>
    </section>
  );
}
