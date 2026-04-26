/**
 * LandingPageFunnel.js
 * Main wrapper component for landing page routes
 * Provides context and routing within the landing page funnel
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { LandingPageProvider } from './LandingPageContext';

// Lazy load funnel pages
const LandingHero = lazy(() => import('./LandingHero'));
const LandingProductPage = lazy(() => import('./LandingProductPage'));
const LandingOrderSuccess = lazy(() => import('./LandingOrderSuccess'));

// Loading spinner
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

function LandingPageFunnel() {
  const { slug } = useParams();

  return (
    <LandingPageProvider slug={slug}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Hero - /{slug} */}
          <Route index element={<LandingHero />} />
          
          {/* Product Page - /{slug}/product */}
          <Route path="product" element={<LandingProductPage />} />
          
          {/* Order Success - /{slug}/order-success/:orderId */}
          <Route path="order-success/:orderId" element={<LandingOrderSuccess />} />
        </Routes>
      </Suspense>
    </LandingPageProvider>
  );
}

export default LandingPageFunnel;
