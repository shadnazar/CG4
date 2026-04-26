/**
 * LandingPageContext.js
 * Shared context for landing page funnel - keeps track of landing page data
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LandingPageContext = createContext(null);

export const useLandingPage = () => {
  const context = useContext(LandingPageContext);
  if (!context) {
    throw new Error('useLandingPage must be used within a LandingPageProvider');
  }
  return context;
};

export const LandingPageProvider = ({ slug, children }) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/landing-pages/public/${slug}`);
        setPageData(res.data);
        setError(null);
      } catch (err) {
        setError('Page not found');
        setPageData(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  // Get dynamic product details
  const content = pageData?.content || {};
  const productName = content.product_name || 'Celesta Glow Anti-Aging Serum';
  const productTagline = content.product_tagline || '4-in-1 Advanced Formula';
  const productDescription = content.product_description || 'Premium anti-aging serum with clinically proven ingredients.';

  const value = {
    slug,
    pageData,
    loading,
    error,
    content,
    productName,
    productTagline,
    productDescription,
    category: pageData?.category || 'general',
    problemTitle: pageData?.problem_title || '',
    // Navigation helpers - all within landing page funnel
    getHeroUrl: () => `/${slug}`,
    getProductUrl: () => `/${slug}/product`,
    getCheckoutUrl: () => `/${slug}/checkout`,
    getOrderSuccessUrl: (orderId) => `/${slug}/order-success/${orderId}`,
  };

  return (
    <LandingPageContext.Provider value={value}>
      {children}
    </LandingPageContext.Provider>
  );
};

export default LandingPageContext;
