import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Star, ShieldCheck, ArrowRight, ChevronRight, Flame } from 'lucide-react';
import CircularCategoryStrip from '../components/CircularCategoryStrip';
import SearchBar from '../components/SearchBar';
import TrustStrip from '../components/TrustStrip';
import { ProductCard } from './ConcernCategoryPage';

const API = process.env.REACT_APP_BACKEND_URL;
const ACCENT = '#0e7490';
const ACCENT_BG = '#cffafe';

/**
 * SkincareHome — niche home for /skincare.
 * Reference-driven structure (Flipkart-Minutes-clean):
 *  1. Search bar
 *  2. CIRCULAR CONCERN STRIP at top
 *  3. Hero banner (cyan gradient, big headline, CTAs, product image)
 *  4. Trust strip (4 columns)
 *  5. Bestsellers grid
 *  6. Skin Analysis CTA
 */
export default function SkincareHome() {
  const [products, setProducts] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/products?niche=skincare`),
      axios.get(`${API}/api/concerns`),
    ])
      .then(([p, c]) => {
        setProducts(p.data || []);
        setConcerns(c.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const bestsellers = useMemo(
    () => [...products].sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0)).slice(0, 10),
    [products]
  );

  return (
    <div className="bg-stone-50/40" data-testid="skincare-home">
      {/* SEARCH */}
      <SearchBar accent={ACCENT} />

      {/* CIRCULAR CONCERN STRIP — at top per reference */}
      <section className="bg-white border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-7">
          <CircularCategoryStrip
            items={concerns}
            routePrefix="/concern"
            title={<>Shop by <span className="italic text-cyan-700">Concern</span></>}
            subtitle="Pick your skin problem"
            accent={ACCENT}
            testIdPrefix="skincare-concern"
          />
        </div>
      </section>

      {/* HERO BANNER */}
      <section className="px-3 sm:px-6 pt-5 sm:pt-7">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-50 via-white to-teal-50 ring-1 ring-cyan-100/70">
          <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 88% 12%, rgba(20,184,166,0.18) 0%, transparent 55%), radial-gradient(circle at 12% 88%, rgba(34,197,94,0.13) 0%, transparent 50%)' }} />
          <div className="relative px-5 sm:px-8 lg:px-12 py-7 sm:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 bg-white/85 backdrop-blur ring-1 ring-cyan-200 px-3 py-1 rounded-full mb-3 sm:mb-4">
                <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.3em] text-cyan-900 uppercase">Skincare Niche</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.05] text-cyan-950 tracking-tight mb-2 sm:mb-3">
                Skincare for every<br/>
                <span className="italic text-cyan-700">skin type &amp; concern.</span>
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-cyan-900/75 max-w-xl leading-relaxed mb-4 sm:mb-6">
                From acne to dullness, dryness to dark spots — pick your concern and we'll show you the routine.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <a href="#" onClick={(e)=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}} className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-[11px] sm:text-sm tracking-wide flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-cyan-900/20 transition-all" data-testid="skincare-shop-cta">
                  Pick your concern <ArrowRight size={13} />
                </a>
                <Link to="/skin-analysis" className="bg-white/85 backdrop-blur ring-1 ring-cyan-300 text-cyan-900 hover:bg-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-[11px] sm:text-sm tracking-wide flex items-center gap-1.5 sm:gap-2 transition-all">
                  <Sparkles size={12} className="text-cyan-700" /> Free Skin Analysis
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative aspect-[5/4] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl ring-2 sm:ring-4 ring-white/50">
                <img src="https://customer-assets.emergentagent.com/job_cg3-render/artifacts/v5vv0e5r_546BA64A-4E90-4675-B7DB-3D2EFDB10675.png" alt="Celesta Glow Daily Defense Sunscreen" className="w-full h-full object-cover" />
                <div className="absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 flex gap-1.5 sm:gap-2">
                  <div className="bg-white/95 backdrop-blur rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 flex items-center gap-1.5 shadow-md">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-cyan-100 flex items-center justify-center"><Star className="fill-amber-400 text-amber-400" size={11} /></span>
                    <div>
                      <div className="text-[11px] sm:text-[13px] font-black text-cyan-900 leading-none">4.8</div>
                      <div className="text-[8px] sm:text-[9px] text-cyan-700/75 leading-none mt-0.5">2,340 reviews</div>
                    </div>
                  </div>
                  <div className="bg-white/95 backdrop-blur rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 flex items-center gap-1.5 shadow-md">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-100 flex items-center justify-center"><ShieldCheck size={11} className="text-green-700" /></span>
                    <div>
                      <div className="text-[9px] sm:text-[10px] font-black text-cyan-900 leading-none">Made for India</div>
                      <div className="text-[8px] sm:text-[9px] text-cyan-700/75 leading-none mt-0.5">Tropical-tested</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="pt-5 sm:pt-7">
        <TrustStrip accent={ACCENT} accentBg={ACCENT_BG} />
      </div>

      {/* BESTSELLERS */}
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

      {/* SKIN ANALYSIS CTA */}
      <section className="bg-gradient-to-r from-cyan-700 via-cyan-800 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, white 0%, transparent 50%), radial-gradient(circle at 15% 85%, white 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
          <p className="text-[10px] sm:text-[11px] font-black tracking-[0.4em] text-cyan-200 uppercase mb-2">Build your routine</p>
          <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2">Not sure where to start?</h2>
          <p className="text-xs sm:text-sm text-cyan-100 max-w-xl mx-auto mb-4 sm:mb-5">Take the 2-minute Skin Analysis and we'll build a personalized routine.</p>
          <Link to="/skin-analysis" className="inline-flex items-center gap-2 bg-white hover:bg-cyan-50 text-cyan-900 px-5 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-2xl hover:-translate-y-0.5 transition-all">
            <Sparkles size={13} className="text-cyan-700" /> Start free skin analysis <ChevronRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
