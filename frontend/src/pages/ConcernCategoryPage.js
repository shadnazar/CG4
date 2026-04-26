import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, ShoppingCart, ArrowRight, Truck, Shield, BadgeCheck, Heart, ChevronLeft, Sparkles, Eye, Flame, Award, Clock, Check } from 'lucide-react';
import { addToCart } from './Homepage';
import CircularCategoryStrip from '../components/CircularCategoryStrip';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * ConcernCategoryPage - shared component for /concern/:slug and /category/:slug.
 *
 * Concern mode:
 *   1. Hero with concern accent
 *   2. CIRCULAR CATEGORY STRIP — shows skincare categories that have products for this concern.
 *   3. (When ?cat=slug query is set OR no categories) - product grid for the selected category / all
 *
 * Category mode:
 *   1. Hero with category accent
 *   2. Product grid (all products in this category)
 */
export default function ConcernCategoryPage({ mode = 'concern' }) {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');

  useEffect(() => {
    setLoading(true);
    setActiveCat('all');
    const calls = [
      mode === 'concern'
        ? axios.get(`${API}/api/concerns/${slug}`)
        : axios.get(`${API}/api/categories/${slug}`),
    ];
    if (mode === 'concern') {
      calls.push(axios.get(`${API}/api/categories`));
    }
    Promise.all(calls)
      .then(([main, cats]) => {
        setData(main.data);
        if (cats) setAllCategories(cats.data || []);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug, mode]);

  const products = data?.products || [];
  const head = mode === 'concern' ? data?.concern : data?.category;

  // For concern mode: categories that have at least 1 product for this concern (with metadata)
  const concernCategoryItems = useMemo(() => {
    if (mode !== 'concern' || !products.length) return [];
    const slugs = new Set(products.map(p => p.category).filter(Boolean));
    return allCategories
      .filter(c => slugs.has(c.slug))
      .map(c => ({
        ...c,
        accent_from: head?.accent_from || '#dcfce7',
        accent_to: head?.accent_to || '#bbf7d0',
        // Override route prefix not used; we'll pass routePrefix to strip
      }));
  }, [products, allCategories, mode, head]);

  // Product grid filter based on activeCat (concern mode only)
  const visibleProducts = useMemo(() => {
    if (mode === 'concern' && activeCat !== 'all') {
      return products.filter(p => p.category === activeCat);
    }
    return products;
  }, [products, activeCat, mode]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!head) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>Page not found.</p>
          <Link to="/" className="text-green-700 underline mt-2 inline-block">Back to home</Link>
        </div>
      </div>
    );
  }

  const accentFrom = head.accent_from || '#dcfce7';
  const accentTo = head.accent_to || '#bbf7d0';
  const accentText = head.accent_text || '#14532d';

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50" data-testid={`${mode}-page`}>
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accentFrom} 0%, ${accentTo} 100%)` }}
      >
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <Link to={mode === 'concern' ? '/skincare' : '/cosmetics'} className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4 hover:underline" style={{ color: accentText }}>
            <ChevronLeft size={13} /> Back to {mode === 'concern' ? 'Skincare' : 'Cosmetics'}
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
            <div className="md:col-span-7 lg:col-span-8">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase mb-1.5 sm:mb-2" style={{ color: accentText, opacity: 0.7 }}>
                {mode === 'concern' ? 'SHOP BY CONCERN' : 'SHOP BY CATEGORY'}
              </p>
              <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-2 sm:mb-3" style={{ color: accentText }}>
                {head.icon && <span className="mr-2">{head.icon}</span>}
                {head.name}
              </h1>
              {head.tagline && (
                <p className="text-xs sm:text-base font-semibold mb-1 sm:mb-2" style={{ color: accentText, opacity: 0.85 }}>
                  {head.tagline}
                </p>
              )}
              {head.description && (
                <p className="text-xs sm:text-base max-w-2xl leading-relaxed" style={{ color: accentText, opacity: 0.75 }}>
                  {head.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-4 sm:mt-5 text-[10px] sm:text-xs font-semibold flex-wrap">
                <span className="bg-white/70 backdrop-blur px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5" style={{ color: accentText }}>
                  <BadgeCheck size={11} /> Dermatologist Tested
                </span>
                <span className="bg-white/70 backdrop-blur px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5" style={{ color: accentText }}>
                  <Truck size={11} /> Free Shipping
                </span>
                <span className="bg-white/70 backdrop-blur px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5" style={{ color: accentText }}>
                  <Shield size={11} /> 30-Day Return
                </span>
              </div>
            </div>
            {head.image && (
              <div className="md:col-span-5 lg:col-span-4">
                <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden ring-2 sm:ring-4 ring-white/40 shadow-2xl">
                  <img src={head.image} alt={head.name} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONCERN MODE: CIRCULAR CATEGORY PICKER */}
      {mode === 'concern' && concernCategoryItems.length > 0 && (
        <section className="bg-white border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-7 sm:py-10">
            <CircularCategoryStrip
              items={concernCategoryItems}
              routePrefix="/category"
              title={<>Choose a <span className="italic" style={{ color: accentText }}>product type</span></>}
              subtitle={`For ${head.name.toLowerCase()}`}
              accent={accentText}
              testIdPrefix="concern-cat"
            />
          </div>
        </section>
      )}

      {/* PRODUCT GRID */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-7 sm:py-12">
        <div className="flex items-end justify-between mb-4 sm:mb-5 px-1">
          <h2 className="font-heading text-base sm:text-2xl font-black text-gray-900">
            {visibleProducts.length} product{visibleProducts.length === 1 ? '' : 's'}
            {mode === 'concern' ? ' for ' : ' in '}
            <span style={{ color: accentText }}>{head.name}</span>
          </h2>
          <Link to="/shop" className="text-[11px] sm:text-xs font-bold hover:underline flex items-center gap-1" style={{ color: accentText }}>
            View entire shop <ArrowRight size={12} />
          </Link>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center text-sm text-gray-500" style={{ borderColor: accentFrom }}>
            No products yet for this {mode === 'concern' ? 'concern' : 'category'}. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {visibleProducts.map(product => <ProductCard key={product.slug} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}


/**
 * Reusable Product Card — fully responsive, consistent heights via flex.
 * Used on Shop, Concern, Category, and niche-home pages.
 */
export function ProductCard({ product, compact = false }) {
  const orders = useMemo(() => Math.floor(Math.random() * 40) + 30, [product.slug]); // eslint-disable-line
  const piecesLeft = useMemo(() => Math.floor(Math.random() * 20) + 5, [product.slug]); // eslint-disable-line
  const viewing = useMemo(() => Math.floor(Math.random() * 20) + 8, [product.slug]); // eslint-disable-line
  const stockPct = Math.min(100, Math.max(8, Math.round((piecesLeft / 30) * 100)));
  const isLowStock = piecesLeft <= 10;
  const isHotSeller = orders >= 50;

  return (
    <div
      className="group relative bg-white rounded-2xl sm:rounded-3xl ring-1 ring-gray-200/70 hover:ring-green-300 overflow-hidden hover:shadow-[0_18px_50px_-15px_rgba(34,197,94,0.22)] hover:-translate-y-1 transition-all duration-500 flex flex-col h-full"
      data-testid={`product-card-${product.slug}`}
    >
      {/* TOP RIBBON */}
      {product.is_to_be_launched ? (
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 text-center tracking-[0.16em] flex items-center justify-center gap-1 uppercase">
          <Clock size={10} />
          {product.days_to_launch != null ? `Launching in ${product.days_to_launch}d` : 'Coming Soon'}
        </div>
      ) : (
        <div className="text-[9px] sm:text-[10px] font-black tracking-[0.16em] uppercase">
          {product.badge === 'Bestseller' && (
            <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-amber-950 px-2 sm:px-3 py-1 sm:py-1.5 text-center flex items-center justify-center gap-1 sm:gap-1.5">
              <Award size={10} /> #1 Bestseller
            </div>
          )}
          {product.badge === 'New Launch' && (
            <div className="bg-green-700 text-white px-2 sm:px-3 py-1 sm:py-1.5 text-center flex items-center justify-center gap-1 sm:gap-1.5">
              <Sparkles size={10} /> New Launch
            </div>
          )}
          {!product.badge && (
            <div className="bg-green-50 text-green-800 px-2 sm:px-3 py-1 sm:py-1.5 text-center flex items-center justify-center gap-1 sm:gap-1.5">
              <BadgeCheck size={10} /> Derm Tested
            </div>
          )}
          {product.badge && product.badge !== 'Bestseller' && product.badge !== 'New Launch' && (
            <div className="bg-green-50 text-green-800 px-2 sm:px-3 py-1 sm:py-1.5 text-center flex items-center justify-center gap-1 sm:gap-1.5">
              <BadgeCheck size={10} /> {product.badge}
            </div>
          )}
        </div>
      )}

      {/* CHIPS - corner badges */}
      <div className="absolute top-7 sm:top-9 left-2 sm:left-3 z-10 flex flex-col gap-1 items-start">
        {!product.is_to_be_launched && product.discount_percent > 0 && (
          <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-md tracking-wide">
            -{product.discount_percent}%
          </span>
        )}
        {isHotSeller && !product.is_to_be_launched && (
          <span className="bg-orange-500/95 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-md flex items-center gap-0.5 sm:gap-1">
            <Flame size={9} className="fill-white" /> Hot
          </span>
        )}
      </div>
      <button aria-label="Wishlist" className="absolute top-7 sm:top-9 right-2 sm:right-3 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur ring-1 ring-gray-200 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-white hover:ring-rose-200 transition-all">
        <Heart size={12} />
      </button>

      {/* IMAGE */}
      <Link to={`/product/${product.slug}`} className="block">
        <div className="aspect-square bg-gradient-to-br from-stone-50 via-white to-green-50/40 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.10) 0%, transparent 65%)' }} />
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.short_name} loading="lazy" className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-md" />
          ) : (
            <Sparkles className="w-10 h-10 text-green-200" />
          )}
        </div>
      </Link>

      {/* CONTENT */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* RATING */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={10} className={i <= Math.floor(product.rating || 4.8) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
            ))}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-700">{(product.rating || 4.8).toFixed(1)}</span>
          <span className="text-[10px] sm:text-[11px] text-gray-400">({product.reviews_count?.toLocaleString() || '0'})</span>
        </div>

        {/* TITLE — locked min-height for alignment */}
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-bold text-gray-900 text-[13px] sm:text-[15px] leading-snug mb-1 group-hover:text-green-700 line-clamp-2 transition-colors min-h-[36px] sm:min-h-[40px]">
            {product.short_name}
          </h3>
        </Link>
        <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1 mb-2 sm:mb-3">
          {product.key_ingredients || 'Clinically formulated'}
        </p>

        {/* PRICE */}
        <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2">
          <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">₹{product.prepaid_price}</span>
          <span className="text-[11px] sm:text-xs text-gray-400 line-through">₹{product.mrp}</span>
          {product.discount_percent > 0 && (
            <span className="text-[10px] sm:text-[11px] font-black text-green-700 ml-auto">SAVE ₹{product.mrp - product.prepaid_price}</span>
          )}
        </div>

        {/* COUPON */}
        {!product.is_to_be_launched && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Check size={8} className="text-white" strokeWidth={3} />
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-900 font-semibold leading-tight">
              ₹{product.prepaid_price - 50} with <span className="font-mono font-black bg-white px-1 py-0.5 rounded text-[9px] sm:text-[10px]">WELCOME50</span>
            </p>
          </div>
        )}

        {/* SOCIAL PROOF + STOCK */}
        {!product.is_to_be_launched && !compact && (
          <div className="mb-2 sm:mb-3 space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-semibold">
              <span className="text-gray-600 flex items-center gap-0.5 sm:gap-1"><Eye size={9} className="text-green-600" /> {viewing} viewing</span>
              <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-green-700'}`}>Only {piecesLeft} left</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${isLowStock ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-green-400 to-green-600'}`} style={{ width: `${stockPct}%` }} />
            </div>
          </div>
        )}

        {/* CTA - pinned to bottom */}
        {product.is_to_be_launched ? (
          <button disabled className="mt-auto w-full bg-gray-100 text-gray-400 text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
            <Clock size={13} /> Coming Soon
          </button>
        ) : (
          <button
            onClick={() => addToCart(product.slug)}
            className="mt-auto group/btn relative w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-[12px] sm:text-sm font-black py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md shadow-green-700/20 hover:shadow-lg hover:shadow-green-700/30 hover:-translate-y-0.5"
            data-testid={`add-cart-${product.slug}`}
          >
            <ShoppingCart size={13} />
            <span className="tracking-wide">ADD TO CART</span>
            <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
          </button>
        )}

        {/* TRUST FOOTER */}
        <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-3 gap-0.5 text-[8px] sm:text-[9px] font-semibold text-gray-500">
          <span className="flex items-center justify-center gap-0.5"><Truck size={9} className="text-green-600" /> Free</span>
          <span className="flex items-center justify-center gap-0.5"><Shield size={9} className="text-green-600" /> 30-day</span>
          <span className="flex items-center justify-center gap-0.5"><BadgeCheck size={9} className="text-green-600" /> COD</span>
        </div>
      </div>
    </div>
  );
}
