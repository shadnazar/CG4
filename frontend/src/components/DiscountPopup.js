import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { X, Gift, Check, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.log('localStorage error:', e);
    }
  }
};

// Safe tracking function
const safeTrack = async (action, data) => {
  try {
    // Non-blocking tracking - don't await
    fetch(`${API}/tracking/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        ...data,
        timestamp: new Date().toISOString()
      })
    }).catch((err) => {
      if (process.env.NODE_ENV === 'development') console.warn('Tracking failed:', err);
    });
  } catch (e) {
    // Silently fail - tracking should never crash the app
    if (process.env.NODE_ENV === 'development') console.warn('safeTrack error:', e);
  }
};

function DiscountPopup({ sessionId, currentPage, onClose }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Check if already claimed
  useEffect(() => {
    try {
      if (safeLocalStorage.getItem('discountClaimed')) {
        onClose();
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.warn('DiscountPopup check error:', e);
    }
  }, [onClose]);

  const handleClose = () => {
    try {
      safeTrack('popup_dismissed', { popup: 'discount' });
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.warn('Track dismiss error:', e);
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    if (!acceptedTerms) {
      setError('Please accept the terms and conditions');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Set cookie consent
      safeLocalStorage.setItem('cookieConsent', 'accepted');
      
      // Claim discount API call
      const res = await axios.post(`${API}/claim-discount`, {
        phone: cleanPhone,
        session_id: sessionId || 'unknown',
        page: currentPage || 'homepage'
      });
      
      if (res.data.success) {
        setSuccess(true);
        setDiscountCode(res.data.discount_code || 'WELCOME50');
        
        // Store in localStorage
        safeLocalStorage.setItem('discountClaimed', 'true');
        safeLocalStorage.setItem('discountCode', res.data.discount_code || 'WELCOME50');
        
        // Dispatch custom event to notify other components (like ProductPage checkout)
        window.dispatchEvent(new CustomEvent('discountClaimed', { 
          detail: { amount: 50, code: res.data.discount_code || 'WELCOME50' } 
        }));
        
        // Track (non-blocking)
        safeTrack('discount_claimed', { phone: cleanPhone, amount: 50 });
        
      } else if (res.data.already_claimed) {
        setError('This number has already claimed the discount');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.log('Discount claim error:', err);
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" data-testid="discount-popup">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        {!success ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center relative">
              <button 
                onClick={handleClose}
                className="absolute top-3 right-3 text-white/80 hover:text-white"
                type="button"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">Unlock ₹50 OFF!</h2>
              <p className="text-green-100 text-sm mt-1">Exclusive first-time visitor discount</p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your mobile number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 bg-gray-50 text-gray-500 rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter 10 digit number"
                    maxLength={10}
                    data-testid="discount-phone-input"
                  />
                </div>
              </div>
              
              {/* Terms & Conditions Checkbox */}
              <div className="mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-green-500 rounded border-gray-300 focus:ring-green-500"
                    data-testid="terms-checkbox"
                  />
                  <span className="text-xs text-gray-500">
                    By claiming this discount, I agree to the{' '}
                    <Link to="/terms" className="text-green-600 underline" target="_blank">
                      Terms & Conditions
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-green-600 underline" target="_blank">
                      Privacy Policy
                    </Link>
                    , including the use of cookies for personalized experience.
                  </span>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading || phone.length !== 10 || !acceptedTerms}
                className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="claim-discount-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift size={18} />
                    Claim ₹50 Discount
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-400 text-center mt-3">
                We'll send your discount code via SMS
              </p>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Discount Unlocked!</h2>
            <p className="text-gray-500 mb-4">Use this code at checkout:</p>
            
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <p className="text-2xl font-bold text-green-600 tracking-wider">{discountCode || 'WELCOME50'}</p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-3 mb-4">
              <p className="text-green-700 text-sm font-medium">₹50 OFF on your order!</p>
            </div>
            
            <button
              onClick={onClose}
              type="button"
              className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscountPopup;
