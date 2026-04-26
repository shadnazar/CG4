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
      <SearchBar accent={ACCENT} />

      <NicheHero
        bgImage={BANNER_IMG}
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

      {/* Bestsellers — same product card as Skincare/Cosmetics */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
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

      {/* Complete Kit — flagship offer */}
      {kit && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-8 sm:pb-12" data-testid="complete-kit-section">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white shadow-xl ring-1 ring-emerald-200/40">
            <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(250,204,21,0.4) 0%, transparent 45%), radial-gradient(circle at 15% 80%, rgba(20,184,166,0.4) 0%, transparent 50%)' }} />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 sm:p-8 lg:p-10 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-300/20 ring-1 ring-amber-300/40 px-2.5 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black tracking-[0.3em] text-amber-200 uppercase">Signature Bundle</span>
                </div>
                <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-2">{kit.name}</h3>
                <p className="text-sm text-emerald-100/85 mb-4 max-w-md leading-relaxed">{kit.description}</p>
                <div className="flex items-center gap-1.5 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-amber-300 text-amber-300" />)}
                  <span className="text-[11px] text-emerald-100/80 ml-1 font-semibold">4.9 · 12k+ reviews</span>
                </div>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight">₹{kit.combo_prepaid_price?.toLocaleString()}</span>
                  <span className="text-sm text-white/40 line-through mb-1">₹{kit.mrp_total?.toLocaleString()}</span>
                  <span className="text-[10px] font-black tracking-wider bg-amber-400 text-emerald-950 px-2 py-1 rounded-full">−{kit.discount_percent}% OFF</span>
                </div>
                <button
                  onClick={() => handleAddCombo(kit.combo_id)}
                  data-testid="add-complete-kit"
                  className="group/btn w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black py-3 px-6 rounded-full text-sm tracking-wide shadow-2xl shadow-amber-900/20 transition-all hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} /> Add Complete Kit <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                </button>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-emerald-100/70">
                  <span className="flex items-center gap-1"><Truck size={11} /> Free shipping</span>
                  <span className="flex items-center gap-1"><Shield size={11} /> 30-day return</span>
                  <span className="flex items-center gap-1"><Check size={11} /> COD avail.</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {kit.product_slugs?.slice(0, 5).map((slug, i) => {
                  const p = products.find(pr => pr.slug === slug);
                  return (
                    <div
                      key={slug}
                      className={`bg-white/10 backdrop-blur ring-1 ring-white/15 rounded-2xl aspect-square flex items-center justify-center p-3 ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                    >
                      {p?.images?.[0] ? <img src={p.images[0]} alt={p.short_name} className="w-full h-full object-contain" /> : <Sparkles className="w-6 h-6 text-amber-300/70" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

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
