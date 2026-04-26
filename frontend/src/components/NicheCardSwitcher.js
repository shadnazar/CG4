import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Sparkles, Droplet, Lock } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const ICON_MAP = {
  'anti-aging': Sparkles,
  'skincare': Droplet,
  'cosmetics': Lock,
};

const FALLBACK_IMAGES = {
  'anti-aging': 'https://images.unsplash.com/photo-1620916297893-c2cd4f5fb73f?auto=format&fit=crop&w=600&q=80',
  'skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'cosmetics': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
};

const TAGLINES = {
  'anti-aging': 'Youthful\nRadiance',
  'skincare': 'Healthy\nGlowing Skin',
  'cosmetics': 'Enhance\nYour Beauty',
};

/**
 * NicheCardSwitcher — premium 3-card niche switcher (replaces the pill bar).
 * Per Flipkart/category reference design:
 * - Large rounded card per niche
 * - Product image as background OR floating
 * - Niche name + tagline
 * - Round icon chip top-right (niche-specific icon)
 * - Round arrow CTA bottom-right (niche accent color)
 * - Active card has slight scale + brand-color ring
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
    <section className="bg-gradient-to-b from-white via-stone-50/40 to-white py-3 sm:py-4" data-testid="niche-card-switcher">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          {niches.map(n => {
            const active = isActive(n.route);
            const Icon = ICON_MAP[n.slug] || Sparkles;
            const image = FALLBACK_IMAGES[n.slug];
            const tagline = TAGLINES[n.slug] || n.tagline;
            // accent text color for arrow CTA — niche-specific
            const arrowBg = active
              ? n.accent_text
              : (n.slug === 'cosmetics' ? '#fb7185' : (n.slug === 'skincare' ? '#0e7490' : '#16a34a'));
            return (
              <Link
                key={n.slug}
                to={n.route}
                data-testid={`niche-card-${n.slug}`}
                className={`group relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[16/13] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 ${
                  active
                    ? 'ring-2 sm:ring-[3px] shadow-xl shadow-black/10 scale-[1.01]'
                    : 'ring-1 ring-stone-200 hover:ring-stone-300 hover:-translate-y-1 hover:shadow-lg'
                }`}
                style={
                  active
                    ? {
                        background: `linear-gradient(160deg, ${n.accent_from} 0%, ${n.accent_to} 100%)`,
                        '--tw-ring-color': arrowBg,
                      }
                    : { background: `linear-gradient(160deg, ${n.accent_from || '#f5f5f4'}aa 0%, ${n.accent_to || '#e7e5e4'}aa 100%)` }
                }
              >
                {/* Product image — large, floating */}
                {image && (
                  <img
                    src={image}
                    alt={n.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-55 sm:opacity-65 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                {/* Soft white overlay so text reads */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/15 to-transparent pointer-events-none" />
                {/* Glossy stripe */}
                <div className="absolute inset-x-0 top-0 h-1/2 opacity-40 pointer-events-none" style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)' }} />

                {/* Top-right icon chip */}
                <div
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ color: arrowBg }}
                >
                  <Icon size={14} strokeWidth={2.4} className="sm:w-4 sm:h-4" />
                </div>

                {/* Title + tagline */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 sm:top-auto sm:bottom-12 sm:translate-y-0 px-2.5 sm:px-4 text-center sm:text-left">
                  <h3
                    className="font-heading font-black text-[14px] sm:text-lg lg:text-xl leading-tight tracking-tight"
                    style={{ color: n.accent_text }}
                  >
                    {n.name.split(' &')[0]}
                  </h3>
                  <p
                    className="hidden sm:block text-[11px] sm:text-xs font-semibold leading-snug mt-0.5 whitespace-pre-line"
                    style={{ color: n.accent_text, opacity: 0.7 }}
                  >
                    {tagline}
                  </p>
                </div>

                {/* Bottom-right arrow CTA */}
                <div
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg transition-all group-hover:translate-x-0.5"
                  style={{ background: arrowBg, color: '#ffffff' }}
                >
                  <ArrowRight size={13} strokeWidth={2.6} className="sm:w-[15px] sm:h-[15px]" />
                </div>

                {/* Active badge */}
                {active && (
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 hidden sm:flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: arrowBg }} />
                    <span className="text-[9px] font-black tracking-[0.18em] uppercase" style={{ color: arrowBg }}>Browsing</span>
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
