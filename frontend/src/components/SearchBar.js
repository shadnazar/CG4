import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ScanLine } from 'lucide-react';

/**
 * Premium search bar for niche home pages.
 * Submits to /shop?q=<query>
 */
export default function SearchBar({ accent = '#16a34a' }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e?.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    navigate(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="bg-white" data-testid="home-search-bar">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <form onSubmit={submit} className="relative group">
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-md"
            style={{ background: `linear-gradient(135deg, ${accent}40 0%, transparent 70%)` }}
          />
          <div className="relative flex items-center bg-white border border-stone-200 group-focus-within:border-stone-300 rounded-2xl shadow-sm transition-all">
            <Search size={18} className="ml-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for products, concerns…"
              className="flex-1 px-3 py-3 sm:py-3.5 bg-transparent text-sm sm:text-[15px] focus:outline-none placeholder-gray-400"
              data-testid="search-input"
            />
            <button
              type="submit"
              aria-label="Scan / Search"
              className="mr-2 sm:mr-3 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-gray-600 transition-colors"
              data-testid="search-scan-btn"
            >
              <ScanLine size={16} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
