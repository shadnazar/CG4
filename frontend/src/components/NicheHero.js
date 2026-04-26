import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * NicheHero — single banner card with the full-bleed artwork as background and
 * text content overlaid on the LEFT half. Matches the IMG_1674 dashboard mock.
 *
 * Props:
 *  - bgImage: full banner artwork URL (product is anchored right within the artwork)
 *  - eyebrow: small uppercase tagline (e.g. "SKINCARE NICHE")
 *  - eyebrowDot: hex color for the pulsing dot
 *  - title: ReactNode — first line + italic second line
 *  - subtitle: paragraph
 *  - cta1: { label, to } — primary pill (filled accent)
 *  - cta2: { label, to } — secondary pill (white outlined)
 *  - accent: hex — primary button background
 *  - accentDark: hex — primary button hover
 *  - tintFrom / tintTo: optional overlay tint (rgba) for legibility on left side
 */
export default function NicheHero({
  bgImage,
  eyebrow,
  eyebrowDot = '#0e7490',
  eyebrowText = '#155e75',
  title,
  subtitle,
  cta1,
  cta2,
  accent = '#0e7490',
  accentDark = '#155e75',
  testId = 'niche-hero',
}) {
  return (
    <section className="px-3 sm:px-6 pt-4 sm:pt-6" data-testid={testId}>
      <div className="max-w-7xl mx-auto relative overflow-hidden rounded-2xl sm:rounded-3xl ring-1 ring-stone-200/70 shadow-sm bg-stone-100">
        {/* Background banner artwork */}
        <img
          src={bgImage}
          alt=""
          loading="eager"
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
        {/* Left-fading legibility overlay so text reads on top of any artwork */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0.18) 52%, rgba(255,255,255,0) 70%)',
          }}
        />
        {/* Mobile bottom fade so text remains readable on small viewports */}
        <div
          className="absolute inset-0 pointer-events-none sm:hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.20) 35%, rgba(255,255,255,0) 60%)',
          }}
        />

        {/* Content overlay (left half) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12">
          <div className="col-span-7 px-5 py-6 sm:px-8 sm:py-12 lg:px-12 lg:py-16 max-w-[680px]">
            {/* Eyebrow chip */}
            {eyebrow && (
              <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur ring-1 ring-stone-200 px-2.5 py-1 rounded-full mb-3 sm:mb-4 shadow-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: eyebrowDot }}
                />
                <span
                  className="text-[10px] font-black tracking-[0.28em] uppercase"
                  style={{ color: eyebrowText }}
                >
                  {eyebrow}
                </span>
              </div>
            )}
            {/* Title */}
            <h1 className="font-heading text-[26px] sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight text-stone-900 mb-2 sm:mb-3">
              {title}
            </h1>
            {/* Subtitle */}
            {subtitle && (
              <p className="text-[12px] sm:text-base lg:text-lg text-stone-700/80 max-w-md leading-relaxed mb-4 sm:mb-6">
                {subtitle}
              </p>
            )}
            {/* CTAs */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {cta1 && (
                <Link
                  to={cta1.to}
                  data-testid={`${testId}-cta1`}
                  className="text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-[12px] sm:text-sm tracking-tight flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all hover:-translate-y-0.5"
                  style={{ background: accent }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = accentDark)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = accent)}
                >
                  {cta1.label} <ArrowRight size={13} />
                </Link>
              )}
              {cta2 && (
                <Link
                  to={cta2.to}
                  data-testid={`${testId}-cta2`}
                  className="bg-white/95 backdrop-blur ring-1 ring-stone-300 text-stone-900 hover:bg-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-[12px] sm:text-sm tracking-tight flex items-center gap-1.5 sm:gap-2 transition-all hover:-translate-y-0.5"
                >
                  <Sparkles size={12} style={{ color: accent }} /> {cta2.label}
                </Link>
              )}
            </div>
          </div>
          {/* Spacer so banner artwork's product side stays visible on small+ */}
          <div className="col-span-5 hidden sm:block min-h-[260px] lg:min-h-[360px]" />
          {/* On mobile, reserve aspect ratio so banner art is visible below text */}
          <div className="block sm:hidden h-44" />
        </div>
      </div>
    </section>
  );
}
