import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ChevronRight, Flame, Sparkles } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import TrustStrip from '../components/TrustStrip';
import NicheHero from '../components/NicheHero';
import { ProductCard } from './ConcernCategoryPage';

const API = process.env.REACT_APP_BACKEND_URL;
const ACCENT = '#0e7490';
const ACCENT_DARK = '#155e75';
const ACCENT_BG = '#cffafe';

const BANNER_IMG = 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/v5vv0e5r_546BA64A-4E90-4675-B7DB-3D2EFDB10675.png';

/**
 * SkincareHome — niche home for /skincare.
 * Identical structure to AntiAgingHome and CosmeticsHome:
 *  1. Search bar
 *  2. Hero banner (image-as-background, text-overlay-left)
 *  3. Trust strip
 *  4. Bestsellers grid
 *  5. CTA card
 */
export default function SkincareHome() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/products?niche=skincare`)
      .then(r => setProducts(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const bestsellers = useMemo(
    () => [...products].sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0)).slice(0, 10),
    [products]
  );

  return (
    <div className="bg-stone-50/40" data-testid="skincare-home">
      <SearchBar accent={ACCENT} />

      <NicheHero
        bgImage={BANNER_IMG}
        eyebrow="Skincare Niche"
        eyebrowDot={ACCENT}
        eyebrowText={ACCENT_DARK}
        title={<>Skincare for every<br/><span className="italic font-light" style={{ color: ACCENT_DARK }}>skin type &amp; concern.</span></>}
        subtitle="From acne to dullness, dryness to dark spots — pick your concern and we'll show you the routine."
        cta1={{ label: 'Pick your concern', to: '/categories' }}
        cta2={{ label: 'Free Skin Analysis', to: '/skin-analysis' }}
        accent={ACCENT}
        accentDark={ACCENT_DARK}
        testId="skincare-hero"
      />

      <div className="pt-5 sm:pt-7">
        <TrustStrip accent={ACCENT} accentBg={ACCENT_BG} />
      </div>

      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
        <div className="flex items-end justify-between mb-4 sm:mb-6 px-1 sm:px-0">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.4em] text-cyan-700 uppercase mb-1 sm:mb-1.5 flex items-center gap-2">
              <Flame size={11} className="fill-cyan-700" /> Trending now
            </p>
            <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">
              Skincare <span className="italic text-cyan-700">Bestsellers</span>
            </h2>
          </div>
          <Link to="/shop" className="text-[11px] sm:text-xs font-bold text-cyan-700 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="aspect-[3/5] bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl" />)}
          </div>
        ) : bestsellers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500 ring-1 ring-cyan-100">No bestsellers yet — check back soon.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {bestsellers.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </section>

      <section className="bg-gradient-to-r from-cyan-700 via-cyan-800 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, white 0%, transparent 50%), radial-gradient(circle at 15% 85%, white 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
          <p className="text-[10px] sm:text-[11px] font-black tracking-[0.4em] text-cyan-200 uppercase mb-2">Build your routine</p>
          <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2">Not sure where to start?</h2>
          <p className="text-xs sm:text-sm text-cyan-100 max-w-xl mx-auto mb-4 sm:mb-5">Take the 2-minute Skin Analysis and we'll build a personalized routine.</p>
          <Link to="/routine" className="inline-flex items-center gap-2 bg-white hover:bg-cyan-50 text-cyan-900 px-5 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-2xl hover:-translate-y-0.5 transition-all">
            <Sparkles size={13} className="text-cyan-700" /> Start Routine Builder <ChevronRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
