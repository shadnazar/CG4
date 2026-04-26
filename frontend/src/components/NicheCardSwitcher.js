import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Pre-designed niche card artwork (image already contains title, subtitle, icon & arrow).
const CARD_IMAGES = {
  'anti-aging': 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/egnbiizj_E86525F8-AFBE-4431-B212-D00E13DAFA1C.jpeg',
  'skincare':   'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/tpi0b3jj_171A56DB-E605-493B-94CA-E8823DD9BF61.jpeg',
  'cosmetics':  'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/0qo8dahm_ED352F30-0FBF-4C89-8FBE-F10AE07275B7.jpeg',
};

const ACCENT = {
  'anti-aging': '#0f766e',
  'skincare':   '#1e88e5',
  'cosmetics':  '#fb7185',
};

/**
 * NicheCardSwitcher — three premium niche cards using pre-designed artwork.
 * Each card is a single artwork image (containing its own title/subtitle/icon/arrow)
 * wrapped in a Link. Active card gets a subtle ring + lift.
 */
export default function NicheCardSwitcher() {
  const [niches, setNiches] = useState([]);
  const location = useLocation();

  useEffect(() => {
    axios.get(`${API}/api/niches`).then(r => setNiches(r.data || [])).catch(() => {});
  }, []);

  if (!niches.length) return null;

  const isActive = (route) => {
    if (route === '/') return location.pathname === '/' || location.pathname === '/anti-aging';
    return location.pathname.startsWith(route);
  };

  return (
    <section className="bg-white py-3 sm:py-5" data-testid="niche-card-switcher">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          {niches.map(n => {
            const active = isActive(n.route);
            const image = CARD_IMAGES[n.slug];
            const accent = ACCENT[n.slug] || '#22c55e';
            return (
              <Link
                key={n.slug}
                to={n.route}
                data-testid={`niche-card-${n.slug}`}
                aria-label={n.name}
                className={`group relative block aspect-[7/6] rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 transition-all duration-300 ${
                  active
                    ? 'ring-2 sm:ring-[3px] shadow-xl shadow-black/10 scale-[1.01]'
                    : 'ring-1 ring-stone-200 hover:ring-stone-300 hover:-translate-y-1 hover:shadow-lg'
                }`}
                style={active ? { '--tw-ring-color': accent } : undefined}
              >
                {image ? (
                  <img
                    src={image}
                    alt={n.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-500 text-sm">
                    {n.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
