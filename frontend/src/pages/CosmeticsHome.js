import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ChevronRight, Flame, Sparkles } from 'lucide-react';
import CircularCategoryStrip from '../components/CircularCategoryStrip';
import SearchBar from '../components/SearchBar';
import TrustStrip from '../components/TrustStrip';
import { ProductCard } from './ConcernCategoryPage';

const API = process.env.REACT_APP_BACKEND_URL;
const ACCENT = '#be185d';
const ACCENT_BG = '#fce7f3';

/**
 * CosmeticsHome — niche home for /cosmetics.
 * Reference-driven structure:
 *  1. Search bar
 *  2. CIRCULAR CATEGORY STRIP at top
 *  3. Hero banner
 *  4. Trust strip
 *  5. Bestsellers
 *  6. Complete-the-Look CTA
 */
export default function CosmeticsHome() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/products?niche=cosmetics`),
      axios.get(`${API}/api/categories`),
    ])
      .then(([p, c]) => {
        setProducts(p.data || []);
        setCategories((c.data || [])
          .filter(x => x.group === 'cosmetics' && x.slug !== 'cosmetics-makeup')
          .map(x => ({
            ...x,
            accent_from: '#fce7f3',
            accent_to: '#fbcfe8',
            accent_text: '#831843',
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const bestsellers = useMemo(
    () => [...products].sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0)).slice(0, 10),
    [products]
  );

  return (
    <div className="bg-gradient-to-b from-rose-50/30 via-white to-stone-50/40" data-testid="cosmetics-home">
      {/* SEARCH */}
      <SearchBar accent={ACCENT} />

      {/* CIRCULAR CATEGORY STRIP */}
      <section className="bg-white border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-7">
          <CircularCategoryStrip
            items={categories}
            routePrefix="/category"
            title={<>Shop by <span className="italic text-rose-700">Category</span></>}
            subtitle="Lip · Eye · Brow · Face"
            accent={ACCENT}
            testIdPrefix="cosmetics-cat"
          />
        </div>
      </section>

      {/* HERO BANNER */}
      <section className="px-3 sm:px-6 pt-5 sm:pt-7">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50/60 ring-1 ring-rose-100">
          <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 88% 12%, rgba(244,114,182,0.28) 0%, transparent 55%), radial-gradient(circle at 12% 88%, rgba(251,146,60,0.18) 0%, transparent 50%)' }} />
          <div className="relative px-5 sm:px-8 lg:px-12 py-7 sm:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 bg-white/85 backdrop-blur ring-1 ring-rose-200 px-3 py-1 rounded-full mb-3 sm:mb-4">
                <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.3em] text-rose-900 uppercase">Cosmetics &amp; Makeup</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.05] text-rose-950 tracking-tight mb-2 sm:mb-3">
                Beauty meets<br/>
                <span className="italic text-rose-700">skincare actives.</span>
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-rose-900/75 max-w-xl leading-relaxed mb-4 sm:mb-6">
                Buildable colour, weightless wear, skin-loving actives. Pick your category and shop the look.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <a href="#" onClick={(e)=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}} className="bg-rose-700 hover:bg-rose-800 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-[11px] sm:text-sm tracking-wide flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-rose-900/20 transition-all" data-testid="cosmetics-shop-cta">
                  Shop the edit <ArrowRight size={13} />
                </a>
                <Link to="/category/lipstick" className="bg-white/85 backdrop-blur ring-1 ring-rose-300 text-rose-900 hover:bg-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-[11px] sm:text-sm tracking-wide flex items-center gap-1.5 sm:gap-2 transition-all">
                  💋 Lipstick range
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/50">
                  <img src="https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80" alt="Lipstick" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/50">
                    <img src="https://images.unsplash.com/photo-1583241800698-9c2e3a7b8ba8?auto=format&fit=crop&w=900&q=80" alt="Eye makeup" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/50">
                    <img src="https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80" alt="Brow" className="w-full h-full object-cover" />
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
            <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.4em] text-rose-700 uppercase mb-1 sm:mb-1.5 flex items-center gap-2">
              <Flame size={11} className="fill-rose-700" /> Most-loved
            </p>
            <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">
              Makeup <span className="italic text-rose-700">Bestsellers</span>
            </h2>
          </div>
          <Link to="/shop" className="text-[11px] sm:text-xs font-bold text-rose-700 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="aspect-[3/5] bg-gradient-to-br from-rose-100 to-pink-100 rounded-3xl" />)}
          </div>
        ) : bestsellers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500 ring-1 ring-rose-100">No bestsellers yet — check back soon.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {bestsellers.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </section>

      {/* COMPLETE THE LOOK */}
      <section className="relative overflow-hidden bg-gradient-to-r from-rose-700 via-pink-700 to-rose-800">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black tracking-[0.4em] text-rose-200 uppercase mb-2">Complete the look</p>
            <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2">Glow + Color in one routine.</h2>
            <p className="text-xs sm:text-sm text-rose-100 max-w-xl mb-4 sm:mb-5">Pair our skincare actives with our makeup for a healthy-skin finish.</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/skincare" className="inline-flex items-center gap-1.5 bg-white hover:bg-rose-50 text-rose-900 px-4 py-2 sm:py-2.5 rounded-full font-black text-xs sm:text-sm shadow-xl transition-all">
                Shop skincare <ChevronRight size={13} />
              </Link>
              <Link to="/" className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur ring-1 ring-white/40 text-white hover:bg-white/20 px-4 py-2 sm:py-2.5 rounded-full font-black text-xs sm:text-sm transition-all">
                <Sparkles size={13} /> Anti-aging
              </Link>
            </div>
          </div>
          <div className="relative aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden ring-2 ring-white/40 shadow-2xl">
            <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=80" alt="Complete the look" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
}
