import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ChevronRight, Flame, Sparkles } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import TrustStrip from '../components/TrustStrip';
import NicheHero from '../components/NicheHero';
import CircularCategoryStrip from '../components/CircularCategoryStrip';
import { ProductCard } from './ConcernCategoryPage';

const API = process.env.REACT_APP_BACKEND_URL;
const ACCENT = '#be185d';
const ACCENT_DARK = '#831843';
const ACCENT_BG = '#fce7f3';

/* Cosmetics banner — placeholder until user supplies theirs */
const BANNER_IMG = 'https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=1664&q=80';

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
          .filter(x => x.group === 'cosmetics')
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
      <SearchBar accent={ACCENT} niche="cosmetics" testId="cosmetics-search-bar" />

      {/* Circular cosmetics category strip — below search per IMG_1667 reference */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
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

      <NicheHero
        bgImage={BANNER_IMG}
        eyebrow="Cosmetics Niche"
        eyebrowDot={ACCENT}
        eyebrowText={ACCENT_DARK}
        title={<>Beauty meets<br/><span className="italic font-light" style={{ color: ACCENT_DARK }}>skincare actives.</span></>}
        subtitle="Buildable colour, weightless wear, skin-loving actives. Pick your category and shop the look."
        cta1={{ label: 'Shop categories', to: '/categories' }}
        cta2={{ label: 'Free Skin Analysis', to: '/skin-analysis' }}
        accent={ACCENT}
        accentDark={ACCENT_DARK}
        testId="cosmetics-hero"
      />

      <div className="pt-4 sm:pt-7">
        <TrustStrip accent={ACCENT} accentBg={ACCENT_BG} />
      </div>

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

      <section className="relative overflow-hidden bg-gradient-to-r from-rose-700 via-pink-700 to-rose-800">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
          <p className="text-[10px] sm:text-[11px] font-black tracking-[0.4em] text-rose-200 uppercase mb-2">Complete the look</p>
          <h2 className="font-heading text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2">Glow + Color in one routine.</h2>
          <p className="text-xs sm:text-sm text-rose-100 max-w-xl mx-auto mb-4 sm:mb-5">Pair our skincare actives with our makeup for a healthy-skin finish.</p>
          <Link to="/routine" className="inline-flex items-center gap-2 bg-white hover:bg-rose-50 text-rose-900 px-5 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-2xl hover:-translate-y-0.5 transition-all">
            <Sparkles size={13} className="text-rose-700" /> Start Routine Builder <ChevronRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
