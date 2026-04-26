import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

/* Niche metadata (no in-card icon, just heading + accent) */
const NICHES_META = {
  'anti-aging': { name: 'Anti-Aging', tagline: 'Youthful Radiance', accent: '#0f766e', soft: 'from-emerald-50 to-white' },
  'skincare':   { name: 'Skincare',   tagline: 'Healthy Glowing Skin', accent: '#0e7490', soft: 'from-cyan-50 to-white' },
  'cosmetics':  { name: 'Cosmetics',  tagline: 'Enhance Your Beauty',  accent: '#be185d', soft: 'from-rose-50 to-white' },
};

/* Curated product images per anti-aging product slug (skincare-style square thumbnails) */
const ANTIAGING_FALLBACK_IMG = {
  'anti-aging-serum':       'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
  'anti-aging-cream':       'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
  'under-eye-cream':        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80',
  'sunscreen':              'https://images.unsplash.com/photo-1556228841-a3c527ebefe5?auto=format&fit=crop&w=400&q=80',
  'cleanser':               'https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=400&q=80',
};

/** Single circular tile — image only, label below */
function Circle({ to, image, label, accent, testId }) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className="group flex flex-col items-center text-center focus:outline-none"
    >
      <div
        className="relative w-[78px] h-[78px] sm:w-[96px] sm:h-[96px] rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
        style={{ background: `linear-gradient(135deg, ${accent}33 0%, ${accent}10 60%, transparent 100%)` }}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-stone-50 ring-1 ring-stone-200">
          {image ? (
            <img src={image} alt={label} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200" />
          )}
        </div>
      </div>
      <span className="mt-2 text-[11px] sm:text-[12px] font-bold text-stone-800 leading-tight max-w-[88px] sm:max-w-[100px] line-clamp-2">
        {label}
      </span>
    </Link>
  );
}

/** Section header with niche name and tagline accent */
function NicheSection({ slug, items, query, children }) {
  const meta = NICHES_META[slug];
  if (!items?.length && !children) return null;
  return (
    <section
      className={`relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br ${meta.soft} ring-1 ring-stone-200/70 px-4 sm:px-6 py-5 sm:py-7 mb-5`}
      data-testid={`category-niche-${slug}`}
    >
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-1" style={{ color: meta.accent }}>
            {meta.tagline}
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-stone-900 leading-tight tracking-tight">
            {meta.name}
          </h2>
        </div>
        <Link
          to={slug === 'anti-aging' ? '/' : `/${slug}`}
          className="text-[11px] font-bold hover:underline"
          style={{ color: meta.accent }}
          data-testid={`category-niche-${slug}-viewall`}
        >
          View all →
        </Link>
      </div>
      {children}
    </section>
  );
}

/**
 * /categories — single-scroll mobile-first hub.
 *  - No pill switcher, no icons in tiles.
 *  - Three sections stacked vertically: Anti-Aging products → Skincare categories → Cosmetics categories.
 *  - Each section has a heading + tagline + 4-col image-circle grid.
 *  - Single search input filters all 3 sections live.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/categories`),
      axios.get(`${API}/api/products`),
    ])
      .then(([c, p]) => { setCategories(c.data || []); setProducts(p.data || []); })
      .finally(() => setLoading(false));
  }, []);

  const skincareCats = useMemo(
    () => categories.filter(c => c.group === 'skincare').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories]
  );
  const cosmeticsCats = useMemo(
    () => categories.filter(c => c.group === 'cosmetics').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories]
  );
  const antiAgingProducts = useMemo(
    () => products.filter(p => p.niche === 'anti-aging'),
    [products]
  );

  const filterFn = (item) => !query.trim() || (item.name || item.short_name || '').toLowerCase().includes(query.toLowerCase());

  return (
    <div className="min-h-screen bg-stone-50/60 pb-24" data-testid="categories-page">
      {/* Header + search */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-4">
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-stone-900 tracking-tight" data-testid="categories-title">
            Categories
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            All products across all niches in one place.
          </p>
          <div className="mt-3 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories or products…"
              data-testid="categories-search"
              style={{ fontSize: '16px' }}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-stone-100 ring-1 ring-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-400 text-sm placeholder:text-stone-400 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-4">
        {loading ? (
          <div className="bg-white rounded-2xl ring-1 ring-stone-200/80 p-6 animate-pulse">
            <div className="h-6 w-1/3 bg-stone-100 rounded mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <div key={i} className="aspect-square rounded-full bg-stone-100" />)}
            </div>
          </div>
        ) : (
          <>
            {/* ANTI-AGING — products */}
            <NicheSection slug="anti-aging" items={antiAgingProducts}>
              <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-5">
                {antiAgingProducts.filter(filterFn).map(p => (
                  <Circle
                    key={p.slug}
                    to={`/product/${p.slug}`}
                    image={p.images?.[0] || ANTIAGING_FALLBACK_IMG[p.slug]}
                    label={p.short_name || p.name}
                    accent={NICHES_META['anti-aging'].accent}
                    testId={`cat-circle-${p.slug}`}
                  />
                ))}
              </div>
            </NicheSection>

            {/* SKINCARE — categories */}
            <NicheSection slug="skincare" items={skincareCats}>
              <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-5">
                {skincareCats.filter(filterFn).map(c => (
                  <Circle
                    key={c.slug}
                    to={`/category/${c.slug}`}
                    image={c.image}
                    label={c.name}
                    accent={NICHES_META['skincare'].accent}
                    testId={`cat-circle-${c.slug}`}
                  />
                ))}
              </div>
            </NicheSection>

            {/* COSMETICS — categories */}
            <NicheSection slug="cosmetics" items={cosmeticsCats}>
              <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-5">
                {cosmeticsCats.filter(filterFn).map(c => (
                  <Circle
                    key={c.slug}
                    to={`/category/${c.slug}`}
                    image={c.image}
                    label={c.name}
                    accent={NICHES_META['cosmetics'].accent}
                    testId={`cat-circle-${c.slug}`}
                  />
                ))}
              </div>
            </NicheSection>
          </>
        )}
      </div>
    </div>
  );
}
