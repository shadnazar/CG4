import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Droplet, Lock, Search, Grid3x3 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

/* Niche metadata — color theme + icon for each top-level pill */
const NICHES = [
  {
    slug: 'anti-aging',
    name: 'Anti-Aging',
    tagline: 'Youthful Radiance',
    Icon: Sparkles,
    accent: '#0f766e',
    chipBg: '#d1fae5',
    chipText: '#065f46',
    soft: 'from-emerald-50 via-white to-teal-50/40',
    image: 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/egnbiizj_E86525F8-AFBE-4431-B212-D00E13DAFA1C.jpeg',
  },
  {
    slug: 'skincare',
    name: 'Skincare',
    tagline: 'Healthy Glowing Skin',
    Icon: Droplet,
    accent: '#0e7490',
    chipBg: '#cffafe',
    chipText: '#155e75',
    soft: 'from-cyan-50 via-white to-sky-50/40',
    image: 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/tpi0b3jj_171A56DB-E605-493B-94CA-E8823DD9BF61.jpeg',
  },
  {
    slug: 'cosmetics',
    name: 'Cosmetics',
    tagline: 'Enhance Your Beauty',
    Icon: Lock,
    accent: '#be185d',
    chipBg: '#fce7f3',
    chipText: '#831843',
    soft: 'from-rose-50 via-white to-pink-50/40',
    image: 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/0qo8dahm_ED352F30-0FBF-4C89-8FBE-F10AE07275B7.jpeg',
  },
];

/* Circle item (image inside a colored ring) */
function CircleItem({ to, image, label, accent, testId }) {
  return (
    <Link to={to} data-testid={testId} className="group flex flex-col items-center text-center">
      <div
        className="relative w-[78px] h-[78px] sm:w-[88px] sm:h-[88px] rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
        style={{ background: `linear-gradient(135deg, ${accent}33 0%, ${accent}10 60%, transparent 100%)` }}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-stone-50 ring-1 ring-stone-200">
          {image ? (
            <img src={image} alt={label} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <Grid3x3 size={22} />
            </div>
          )}
        </div>
      </div>
      <span className="mt-2 text-[11px] sm:text-[12px] font-semibold text-stone-800 leading-tight max-w-[90px] line-clamp-2">
        {label}
      </span>
    </Link>
  );
}

/**
 * /categories — mobile-first taxonomy hub.
 * Top: 3 sticky niche pill chips (Anti-Aging / Skincare / Cosmetics)
 * Body: per-niche heading + grid of circular subcategory items.
 *  - Anti-Aging  → flagship products (only 5 SKUs)
 *  - Skincare    → product sub-categories (Facewash, Toner, Serum, Sunscreen, etc.)
 *  - Cosmetics   → product sub-categories (Kajal, Lipsticks, Eyeshadows, etc.)
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState('anti-aging');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/categories`),
      axios.get(`${API}/api/products`),
    ])
      .then(([c, p]) => {
        setCategories(c.data || []);
        setProducts(p.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const skincareCats = useMemo(
    () => categories.filter(c => c.group === 'skincare').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories]
  );
  const cosmeticsCats = useMemo(
    () => categories
      .filter(c => c.group === 'cosmetics' && c.slug !== 'cosmetics-makeup')
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories]
  );
  const antiAgingProducts = useMemo(
    () => products.filter(p => p.niche === 'anti-aging').slice(0, 11),
    [products]
  );

  const niche = NICHES.find(n => n.slug === active) || NICHES[0];

  const filterFn = (item) => !query.trim() || item.name.toLowerCase().includes(query.toLowerCase());

  return (
    <div className="min-h-screen bg-stone-50/60 pb-24" data-testid="categories-page">
      {/* TOP — header + search */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-3">
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-stone-900 tracking-tight" data-testid="categories-title">
            Categories
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Browse by niche → tap a circle to open all products in that section.
          </p>
          {/* Search */}
          <div className="mt-3 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              data-testid="categories-search"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-stone-100 ring-1 ring-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-400 text-sm placeholder:text-stone-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Niche pill switcher */}
        <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 snap-x">
            {NICHES.map(n => {
              const NIcon = n.Icon;
              const isActive = active === n.slug;
              return (
                <button
                  key={n.slug}
                  onClick={() => setActive(n.slug)}
                  data-testid={`niche-pill-${n.slug}`}
                  className={`snap-start flex items-center gap-2 px-4 py-2 rounded-full text-[12px] sm:text-sm font-bold tracking-tight whitespace-nowrap transition-all ${
                    isActive
                      ? 'shadow-md scale-[1.02] ring-2'
                      : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-stone-300'
                  }`}
                  style={isActive ? { background: n.chipBg, color: n.chipText, '--tw-ring-color': n.accent } : undefined}
                >
                  <NIcon size={14} strokeWidth={2.4} />
                  {n.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION HEADER (niche-themed banner) */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${niche.soft} ring-1 ring-stone-200/60 px-5 py-4 flex items-center gap-3`}
          data-testid={`niche-banner-${niche.slug}`}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0 bg-white">
            <img src={niche.image} alt={niche.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: niche.accent }}>
              {niche.tagline}
            </p>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-stone-900 leading-tight truncate">
              {niche.name}
            </h2>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-3xl mx-auto px-3 sm:px-6 mt-4">
        <div
          className="bg-white rounded-2xl ring-1 ring-stone-200/80 px-3 sm:px-5 pt-5 pb-6"
          data-testid={`niche-grid-${niche.slug}`}
        >
          {loading ? (
            <div className="grid grid-cols-4 gap-x-2 gap-y-5 animate-pulse">
              {[...Array(8)].map((_, i) => <div key={i} className="aspect-square rounded-full bg-stone-100" />)}
            </div>
          ) : (
            <>
              {active === 'anti-aging' && (
                <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-5">
                  {antiAgingProducts.filter(filterFn).map(p => (
                    <CircleItem
                      key={p.slug}
                      to={`/product/${p.slug}`}
                      image={p.images?.[0]}
                      label={p.short_name || p.name}
                      accent={niche.accent}
                      testId={`cat-circle-${p.slug}`}
                    />
                  ))}
                  <CircleItem
                    to="/shop"
                    image={'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80'}
                    label="View All"
                    accent={niche.accent}
                    testId="cat-circle-view-all-anti-aging"
                  />
                </div>
              )}
              {active === 'skincare' && (
                <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-5">
                  {skincareCats.filter(filterFn).map(c => (
                    <CircleItem
                      key={c.slug}
                      to={`/category/${c.slug}`}
                      image={c.image}
                      label={c.name}
                      accent={niche.accent}
                      testId={`cat-circle-${c.slug}`}
                    />
                  ))}
                  <CircleItem
                    to="/skincare"
                    image={'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80'}
                    label="View All"
                    accent={niche.accent}
                    testId="cat-circle-view-all-skincare"
                  />
                </div>
              )}
              {active === 'cosmetics' && (
                <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-5">
                  {cosmeticsCats.filter(filterFn).map(c => (
                    <CircleItem
                      key={c.slug}
                      to={`/category/${c.slug}`}
                      image={c.image}
                      label={c.name}
                      accent={niche.accent}
                      testId={`cat-circle-${c.slug}`}
                    />
                  ))}
                  <CircleItem
                    to="/cosmetics"
                    image={'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80'}
                    label="View All"
                    accent={niche.accent}
                    testId="cat-circle-view-all-cosmetics"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
