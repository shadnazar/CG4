import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Sparkles, Droplet, Palette } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

/* Per-niche metadata. Background = clean product/category image (no baked-in text).
   Icon now matches the niche label correctly (Palette for cosmetics, not Lock). */
const META = {
  'anti-aging': {
    icon: Sparkles,
    tagline: 'Youthful Radiance',
    image: 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/egnbiizj_E86525F8-AFBE-4431-B212-D00E13DAFA1C.jpeg',
    arrowBg: '#0f766e',
    titleColor: '#064e3b',
    softFrom: '#d1fae5',
    softTo: '#a7f3d0',
  },
  'skincare': {
    icon: Droplet,
    tagline: 'Healthy Glowing Skin',
    image: 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/tpi0b3jj_171A56DB-E605-493B-94CA-E8823DD9BF61.jpeg',
    arrowBg: '#1e88e5',
    titleColor: '#0c4a6e',
    softFrom: '#dbeafe',
    softTo: '#bfdbfe',
  },
  'cosmetics': {
    icon: Palette,
    tagline: 'Enhance Your Beauty',
    image: 'https://customer-assets.emergentagent.com/job_cg3-render/artifacts/0qo8dahm_ED352F30-0FBF-4C89-8FBE-F10AE07275B7.jpeg',
    arrowBg: '#fb7185',
    titleColor: '#831843',
    softFrom: '#fce7f3',
    softTo: '#fbcfe8',
  },
};

/**
 * NicheCardSwitcher — three premium niche switch cards.
 * Now code-rendered (not full-image artwork) so the icon top-right always matches
 * the niche label. Background uses the same supplied artwork but as decoration only.
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
    return location.pathname === route || location.pathname.startsWith(`${route}/`);
  };

  return (
    <section className="bg-white py-2 sm:py-4" data-testid="niche-card-switcher">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          {niches.map(n => {
            const meta = META[n.slug] || META['anti-aging'];
            const Icon = meta.icon;
            const active = isActive(n.route);
            return (
              <Link
                key={n.slug}
                to={n.route}
                data-testid={`niche-card-${n.slug}`}
                aria-label={n.name}
                className={`group relative block aspect-[7/6] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 ${
                  active
                    ? 'ring-2 sm:ring-[3px] shadow-xl shadow-black/10 scale-[1.01]'
                    : 'ring-1 ring-stone-200 hover:ring-stone-300 hover:-translate-y-1 hover:shadow-lg'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${meta.softFrom} 0%, ${meta.softTo} 100%)`,
                  ...(active ? { '--tw-ring-color': meta.arrowBg } : {}),
                }}
              >
                {/* Background artwork (decorative only) */}
                <img
                  src={meta.image}
                  alt=""
                  loading="lazy"
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {/* Soft white wash so icon + label remain crisp */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.55) 70%, rgba(255,255,255,0.85) 100%)',
                  }}
                />

                {/* Icon top-right (now correct per niche) */}
                <div
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ color: meta.arrowBg }}
                  data-testid={`niche-card-${n.slug}-icon`}
                >
                  <Icon size={14} strokeWidth={2.4} className="sm:w-4 sm:h-4" />
                </div>

                {/* Title + tagline (bottom-left) */}
                <div className="absolute inset-x-0 bottom-10 sm:bottom-12 px-3 sm:px-4">
                  <h3
                    className="font-heading font-black text-[15px] sm:text-lg lg:text-xl leading-tight tracking-tight"
                    style={{ color: meta.titleColor }}
                  >
                    {n.name.split(' &')[0]}
                  </h3>
                  <p
                    className="text-[10px] sm:text-[11px] font-semibold leading-snug mt-0.5"
                    style={{ color: meta.titleColor, opacity: 0.7 }}
                  >
                    {meta.tagline}
                  </p>
                </div>

                {/* Bottom-right arrow CTA */}
                <div
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg transition-all group-hover:translate-x-0.5"
                  style={{ background: meta.arrowBg, color: '#ffffff' }}
                >
                  <ArrowRight size={13} strokeWidth={2.6} className="sm:w-[15px] sm:h-[15px]" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
