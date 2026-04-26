/**
 * LandingProductPage.js
 * Product page that looks EXACTLY like the main ProductPage
 * But uses dynamic content from landing page context
 * URL: /{slug}/product
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, Check, Truck, Shield, ChevronDown, ChevronUp, ChevronRight, Clock, Users, Flame, ShieldCheck, Award, Sparkles, TrendingUp, Gift, CreditCard, BadgeCheck, Verified, Phone, ArrowLeft } from 'lucide-react';
import DermatologistSection from '../../components/DermatologistSection';
import { useTracking } from '../../providers/TrackingProvider';
import { useLandingPage } from './LandingPageContext';
import { getSharedStats, updateSharedStats } from '../../utils/sharedStats';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;

const PREPAID_PRICE = 999;
const COD_PRICE = 1099;
const COD_ADVANCE = 29; // Fixed regardless of quantity
const MRP = 1499;
const DISCOUNT_AMOUNT = 50;
const EXIT_DISCOUNT_AMOUNT = 100;
const REFERRAL_DISCOUNT = 50;

// Bundle pricing - quantity based discounts (same as main page)
const BUNDLE_PRICES = {
  1: { prepaid: 699, cod: 749, mrp: 1499, label: '1 Bottle', savings: '53% OFF' },
  2: { prepaid: 999, cod: 1049, mrp: 2998, label: '2 Bottles', savings: '67% OFF', badge: 'POPULAR' },
  3: { prepaid: 1399, cod: 1449, mrp: 4497, label: '3 Bottles', savings: '69% OFF', badge: 'BEST VALUE' },
  4: { prepaid: 1699, cod: 1749, mrp: 5996, label: '4 Bottles', savings: '72% OFF', badge: 'FAMILY PACK' }
};

const PRODUCT_IMAGE = 'https://customer-assets.emergentagent.com/job_050b785b-bdfe-40d2-9088-b4c5bddc18c5/artifacts/f3fkk4tr_IMG_9115.png';

function LandingProductPage() {
  const navigate = useNavigate();
  const { trackPageVisit, trackViewContent, trackInitiateCheckout, trackPurchase, trackAction, getVisitorId } = useTracking();
  const { slug, pageData, loading: pageLoading, error: pageError, productName, productTagline, productDescription, content, getHeroUrl } = useLandingPage();
  
  const [step, setStep] = useState('product');
  const [expandedSection, setExpandedSection] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', house_number: '', area: '', pincode: '', state: '' });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('prepaid');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 47, seconds: 33 });
  const [viewingNow, setViewingNow] = useState(() => getSharedStats().viewingNow);
  const [soldToday, setSoldToday] = useState(() => getSharedStats().soldToday);
  
  // Discount state
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(DISCOUNT_AMOUNT);
  
  // Quantity state for bundle pricing
  const [quantity, setQuantity] = useState(1);
  
  // Referral state
  const [referralCode, setReferralCode] = useState(null);
  const [referralDiscount, setReferralDiscount] = useState(0);
  
  const pageStartTime = useRef(Date.now());

  // Check referral code
  useEffect(() => {
    const refCode = new URLSearchParams(window.location.search).get('ref') || sessionStorage.getItem('referralCode');
    if (refCode) validateReferralCode(refCode);
  }, []);

  const validateReferralCode = async (code) => {
    try {
      const res = await axios.post(`${API}/referral/validate?referral_code=${code}`);
      if (res.data.valid) {
        setReferralCode(code);
        setReferralDiscount(REFERRAL_DISCOUNT);
        sessionStorage.setItem('referralCode', code);
      }
    } catch (err) {
      sessionStorage.removeItem('referralCode');
    }
  };

  useEffect(() => {
    trackPageVisit(`landing_${slug}_product`);
    trackViewContent(productName, PREPAID_PRICE);
    checkDiscountStatus();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);

    const viewerInterval = setInterval(() => {
      const delta = Math.floor(Math.random() * 5) - 2;
      const stats = getSharedStats();
      const newValue = Math.max(15, Math.min(50, stats.viewingNow + delta));
      updateSharedStats({ viewingNow: newValue });
      setViewingNow(newValue);
    }, 5000);

    return () => { 
      clearInterval(timer);
      clearInterval(viewerInterval);
    };
  }, [slug, productName, trackPageVisit, trackViewContent]);

  useEffect(() => {
    if (step === 'checkout') {
      trackPageVisit(`landing_${slug}_checkout`);
      trackAction('view_checkout', { step: 'checkout_started', from_landing: slug });
      trackInitiateCheckout(PREPAID_PRICE);
    }
  }, [step, slug, trackPageVisit, trackAction, trackInitiateCheckout]);

  const checkDiscountStatus = () => {
    const exitDiscountClaimed = localStorage.getItem('exitDiscountClaimed');
    const regularDiscountClaimed = localStorage.getItem('discountClaimed');
    if (exitDiscountClaimed) { setHasDiscount(true); setDiscountApplied(true); setDiscountAmount(EXIT_DISCOUNT_AMOUNT); }
    else if (regularDiscountClaimed) { setHasDiscount(true); setDiscountApplied(true); setDiscountAmount(DISCOUNT_AMOUNT); }
  };

  const getFinalPrepaidPrice = () => {
    let price = BUNDLE_PRICES[quantity]?.prepaid || PREPAID_PRICE;
    if (hasDiscount) price -= discountAmount;
    if (referralDiscount > 0) price -= referralDiscount;
    return Math.max(price, 0);
  };

  const getFinalCodPrice = () => {
    let price = BUNDLE_PRICES[quantity]?.cod || COD_PRICE;
    if (hasDiscount) price -= discountAmount;
    if (referralDiscount > 0) price -= referralDiscount;
    return Math.max(price, 0);
  };
  
  const getCodBalance = () => {
    return getFinalCodPrice() - COD_ADVANCE;
  };

  const getCurrentMrp = () => {
    return BUNDLE_PRICES[quantity]?.mrp || MRP;
  };

  const getTotalDiscount = () => {
    let discount = 0;
    if (hasDiscount) discount += discountAmount;
    if (referralDiscount > 0) discount += referralDiscount;
    return discount;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.match(/^[6-9]\d{9}$/)) newErrors.phone = 'Enter valid 10-digit number';
    if (!formData.house_number.trim()) newErrors.house_number = 'Required';
    if (!formData.area.trim()) newErrors.area = 'Required';
    if (!formData.pincode.match(/^\d{6}$/)) newErrors.pincode = 'Enter 6-digit pincode';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePincodeChange = async (pincode) => {
    setFormData(prev => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      try {
        const response = await axios.get(`${API}/pincode/${pincode}/state`);
        if (response.data.state) setFormData(prev => ({ ...prev, state: response.data.state }));
      } catch (error) {}
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    setLoading(true);

    let amountToCharge = paymentMethod === 'prepaid' ? getFinalPrepaidPrice() : COD_ADVANCE;
    trackInitiateCheckout(paymentMethod === 'prepaid' ? getFinalPrepaidPrice() : getFinalCodPrice());
    
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { alert('Failed to load payment gateway.'); setLoading(false); return; }

      const orderResponse = await axios.post(`${API}/create-razorpay-order`, { amount: amountToCharge });
      
      const options = {
        key: RAZORPAY_KEY,
        amount: orderResponse.data.amount,
        currency: 'INR',
        name: 'Celesta Glow',
        description: paymentMethod === 'prepaid' ? productName : 'COD Advance',
        order_id: orderResponse.data.id,
        handler: async function (response) {
          try {
            await axios.post(`${API}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            const finalPrice = paymentMethod === 'prepaid' ? getFinalPrepaidPrice() : getFinalCodPrice();
            const order = await axios.post(`${API}/orders`, {
              ...formData,
              payment_method: paymentMethod === 'prepaid' ? 'Prepaid' : 'COD (Advance Paid)',
              amount: finalPrice,
              quantity: quantity,
              discount_applied: discountApplied ? discountAmount : 0,
              referral_code: referralCode || null,
              referral_discount: referralDiscount || 0,
              landing_page_slug: slug
            });
            
            // Track order completion for conversion analytics
            trackAction('order_complete', { 
              order_id: order.data.order_id,
              payment_method: paymentMethod,
              amount: finalPrice,
              quantity: quantity,
              from_landing: slug
            });
            trackAction('landing_conversion', { slug, order_id: order.data.order_id });
            axios.post(`${API}/landing-pages/public/${slug}/convert`).catch(() => {});
            navigate(`/${slug}/order-success/${order.data.order_id}`);
          } catch (error) {
            alert('Order creation failed. Please contact support.');
          }
          setLoading(false);
        },
        prefill: { name: formData.name, contact: formData.phone, email: formData.email },
        theme: { color: '#22C55E' },
        modal: { ondismiss: () => setLoading(false) }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      alert('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        </div>
      </div>
    );
  }

  // CHECKOUT VIEW - Matches main ProductPage checkout
  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-30 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => setStep('product')} className="p-2 -ml-2 text-gray-600">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Secure Checkout</h1>
              <p className="text-xs text-gray-500">{productName}</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex gap-4">
              <img src={PRODUCT_IMAGE} alt={productName} className="w-20 h-20 object-contain rounded-xl bg-gray-50" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{productName}</h3>
                <p className="text-sm text-gray-500">30ml × {quantity} • {productTagline}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-green-600">₹{paymentMethod === 'prepaid' ? getFinalPrepaidPrice().toLocaleString('en-IN') : getFinalCodPrice().toLocaleString('en-IN')}</span>
                  <span className="text-sm text-gray-400 line-through">₹{getCurrentMrp().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            {getTotalDiscount() > 0 && (
              <div className="mt-3 pt-3 border-t border-dashed flex items-center justify-between text-green-600 text-sm font-medium">
                <span className="flex items-center gap-1"><Gift size={16} /> Discount Applied</span>
                <span>-₹{getTotalDiscount()}</span>
              </div>
            )}
          </div>

          {/* Bundle Quantity Selector */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Gift className="text-green-500" size={18} />
              Select Quantity & Save More
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(BUNDLE_PRICES).map(([qty, bundle]) => (
                <button
                  key={qty}
                  onClick={() => setQuantity(parseInt(qty))}
                  className={`relative p-3 rounded-xl border-2 transition-all ${
                    quantity === parseInt(qty) 
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-50 shadow-md' 
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  {bundle.badge && (
                    <span className={`absolute -top-2 -right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      bundle.badge === 'BEST VALUE' ? 'bg-green-500 text-white' :
                      bundle.badge === 'POPULAR' ? 'bg-orange-500 text-white' :
                      'bg-purple-500 text-white'
                    }`}>
                      {bundle.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      quantity === parseInt(qty) ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {quantity === parseInt(qty) && <Check size={12} className="text-white" />}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{bundle.label}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-green-600">₹{bundle.prepaid}</span>
                    <span className="text-xs text-gray-400 line-through">₹{bundle.mrp}</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-green-600 bg-green-100 rounded px-2 py-0.5 inline-block">
                    {bundle.savings}
                  </div>
                </button>
              ))}
            </div>
            
            {/* COD Note */}
            <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 flex items-center gap-1.5">
                <Truck size={14} />
                <span><strong>COD:</strong> Pay only ₹29 now. Balance ₹{getCodBalance().toLocaleString('en-IN')} at delivery.</span>
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="space-y-2">
              <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'prepaid' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'prepaid'} onChange={() => setPaymentMethod('prepaid')} className="sr-only" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Pay Online <span className="line-through text-gray-400">₹{getCurrentMrp().toLocaleString('en-IN')}</span> ₹{getFinalPrepaidPrice().toLocaleString('en-IN')}</p>
                  <p className="text-xs text-green-600">🚀 FASTER DELIVERY (1-2 days) + Save ₹{getFinalCodPrice() - getFinalPrepaidPrice()}</p>
                </div>
                {paymentMethod === 'prepaid' && <Check className="text-green-500" size={24} />}
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded ml-2">BEST</span>
              </label>
              
              <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="sr-only" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Cash on Delivery ₹{getFinalCodPrice().toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">Pay ₹{COD_ADVANCE} now, ₹{getCodBalance().toLocaleString('en-IN')} at delivery (3-5 days)</p>
                </div>
                {paymentMethod === 'cod' && <Check className="text-green-500" size={24} />}
              </label>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
            <div className="space-y-3">
              <div>
                <input type="text" placeholder="Full Name *" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <div className="flex">
                  <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500">+91</span>
                  <input type="tel" placeholder="Phone Number *" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    className={`flex-1 px-4 py-3 rounded-r-xl border ${errors.phone ? 'border-red-500' : 'border-gray-200'} focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`} />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <input type="email" placeholder="Email (Optional)" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" />
              <div>
                <input type="text" placeholder="House/Flat/Building No. *" value={formData.house_number} onChange={(e) => setFormData(prev => ({ ...prev, house_number: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.house_number ? 'border-red-500' : 'border-gray-200'} focus:border-green-500 outline-none`} />
                {errors.house_number && <p className="text-red-500 text-xs mt-1">{errors.house_number}</p>}
              </div>
              <div>
                <input type="text" placeholder="Area/Locality/Street *" value={formData.area} onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.area ? 'border-red-500' : 'border-gray-200'} focus:border-green-500 outline-none`} />
                {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input type="text" placeholder="Pincode *" value={formData.pincode} onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.pincode ? 'border-red-500' : 'border-gray-200'} focus:border-green-500 outline-none`} />
                  {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                </div>
                <input type="text" placeholder="State" value={formData.state} readOnly className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Trust */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Shield size={16} /> Secure</span>
            <span className="flex items-center gap-1"><Truck size={16} /> Free Ship</span>
          </div>

          {/* Pay Button */}
          <button onClick={handlePayment} disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 text-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              paymentMethod === 'prepaid' ? `Pay ₹${getFinalPrepaidPrice()} Now` : `Pay ₹${COD_ADVANCE} Now (₹${getFinalCodPrice() - COD_ADVANCE} at delivery)`
            )}
          </button>
        </div>
      </div>
    );
  }

  // PRODUCT VIEW - Matches main ProductPage exactly
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Urgency Banner */}
      <div className="bg-red-500 text-white py-2 px-4 flex items-center justify-center gap-3 text-sm">
        <Flame size={16} className="animate-pulse" />
        <span className="font-semibold">FLASH SALE:</span>
        <div className="flex gap-1 font-mono font-bold">
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{String(timeLeft.hours).padStart(2, '0')}</span>:
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{String(timeLeft.minutes).padStart(2, '0')}</span>:
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Live Stats */}
      <div className="bg-orange-50 border-b border-orange-100 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-orange-600" />
          <span className="text-orange-800"><b>{viewingNow}</b> viewing now</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-green-600" />
          <span className="text-green-800"><b>{soldToday}</b> sold today</span>
        </div>
      </div>

      {/* Product Image */}
      <div className="p-4">
        <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-purple-50 to-white">
          <img src={PRODUCT_IMAGE} alt={productName} className="w-full h-full object-contain" />
          <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">53% OFF</div>
        </div>
      </div>

      {/* Product Info */}
      <div className="px-4 space-y-4">
        {/* Title & Rating */}
        <div>
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-2">{productTagline}</span>
          <h1 className="text-2xl font-bold text-gray-900">{productName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}</div>
            <span className="text-sm text-gray-600">4.9 (2,847 reviews)</span>
          </div>
        </div>

        {/* Price */}
        <div className="bg-green-50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl font-bold text-green-600">₹{getFinalPrepaidPrice()}</span>
            <span className="text-xl text-gray-400 line-through">₹{MRP}</span>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SAVE ₹{MRP - getFinalPrepaidPrice()}</span>
          </div>
          {getTotalDiscount() > 0 && (
            <div className="flex items-center gap-2 text-green-700 text-sm"><Gift size={16} /><span>₹{getTotalDiscount()} discount applied!</span></div>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Truck size={16} className="text-green-600" /> Free Delivery</span>
            <span className="flex items-center gap-1"><Clock size={16} className="text-green-600" /> 2-3 Days</span>
          </div>
        </div>

        {/* Why #1 */}
        <div className="bg-gradient-to-r from-green-50 to-green-50 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-green-500" /> Why {productName} is #1
          </h3>
          <div className="space-y-2.5">
            {(content.solution_benefits || ['Reduces wrinkles by 47% in 4 weeks', 'Boosts collagen production by 89%', 'Improves skin elasticity in 14 days', '10,000+ happy customers']).slice(0, 4).map((benefit, idx) => (
              <div key={idx} className="check-item flex items-center gap-3">
                <div className="check-icon w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Results */}
        <div className="bg-gray-900 text-white rounded-2xl p-5">
          <p className="text-xs text-green-400 font-medium mb-2">CLINICAL STUDY RESULTS</p>
          <h3 className="text-lg font-bold mb-4">Proven Anti-Aging Results</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-2xl font-bold text-green-400">94%</p><p className="text-xs text-gray-400">Reduced Fine Lines</p></div>
            <div><p className="text-2xl font-bold text-green-400">89%</p><p className="text-xs text-gray-400">Firmer Skin</p></div>
            <div><p className="text-2xl font-bold text-green-400">96%</p><p className="text-xs text-gray-400">More Radiant</p></div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">*Based on 8-week clinical trial</p>
        </div>

        {/* Ingredients */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </span>
            Powerful Active Ingredients
          </h3>
          <div className="space-y-3">
            {[
              { name: '0.3% Retinol', benefit: 'Gold standard for wrinkle reduction', gradient: 'from-purple-500 to-indigo-600', bgGradient: 'from-purple-50 to-indigo-50' },
              { name: 'Hyaluronic Acid', benefit: '72-hour deep hydration', gradient: 'from-blue-500 to-cyan-500', bgGradient: 'from-blue-50 to-cyan-50' },
              { name: '5% Niacinamide', benefit: 'Brightens & evens skin tone', gradient: 'from-amber-500 to-orange-500', bgGradient: 'from-amber-50 to-orange-50' },
              { name: 'Vitamin E Complex', benefit: 'Protects against damage', gradient: 'from-green-500 to-green-500', bgGradient: 'from-green-50 to-green-50' },
            ].map((item, idx) => (
              <div key={idx} className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${item.bgGradient} border border-gray-100`}>
                <div className="p-4 flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-700">{item.benefit}</p>
                  </div>
                  <Check size={20} className="text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dermatologist */}
        <DermatologistSection />

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-2 py-5 border-y border-gray-100">
          {[
            { icon: Truck, label: 'Free Delivery', sublabel: 'All India' },
            { icon: ShieldCheck, label: '100% Genuine', sublabel: 'Authentic' },
            { icon: Clock, label: 'Fast Shipping', sublabel: '2-3 Days' },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                <item.icon size={18} className="text-green-600" />
              </div>
              <p className="text-xs font-semibold text-gray-900">{item.label}</p>
              <p className="text-[10px] text-gray-500">{item.sublabel}</p>
            </div>
          ))}
        </div>

        {/* Buy Button */}
        <button onClick={() => { trackAction('cta_click', { button: 'buy_now', page: 'landing_product' }); trackInitiateCheckout(PREPAID_PRICE); setStep('checkout'); }}
          className="btn-cg-primary w-full py-4 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
          Order Now ₹{getFinalPrepaidPrice()} <ChevronRight size={20} />
        </button>

        <p className="text-center text-xs text-gray-500">COD Available • Easy Returns • Secure Payment</p>

        {/* Money Back */}
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
          <p className="text-green-700 font-semibold text-sm">100% Money Back Guarantee</p>
          <p className="text-green-600 text-xs mt-1">Not satisfied? Full refund within 7 days</p>
        </div>

        {/* Why Choose */}
        <div className="p-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl">
          <h3 className="font-bold mb-4 text-center flex items-center justify-center gap-2 text-white">
            <Award className="text-green-400" size={20} />
            <span>Why 10,000+ Choose {productName.split(' ').slice(0, 3).join(' ')}</span>
          </h3>
          <div className="space-y-3">
            {[
              { icon: TrendingUp, title: 'Visible Results', desc: 'See younger skin in 2-4 weeks', stat: '94%' },
              { icon: Shield, title: 'Safe Formula', desc: 'Dermatologist tested', stat: '100%' },
              { icon: Award, title: 'Award Winning', desc: "India's #1 rated serum", stat: '#1' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/15 backdrop-blur p-3 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <item.icon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-xs text-gray-200">{item.desc}</p>
                </div>
                <p className="text-xl font-bold text-green-400">{item.stat}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 mb-2">Product Details</h3>
          {[
            { id: 'ingredients', title: 'Key Ingredients', content: productDescription || '0.3% Retinol, Niacinamide, Hyaluronic Acid, Vitamin E', highlight: '4-in-1' },
            { id: 'usage', title: 'How to Use', content: 'Cleanse face, apply 2-3 drops to face and neck, follow with moisturizer. Use sunscreen during day.', highlight: 'Night Use' },
            { id: 'clinical', title: 'Clinical Results', content: '94% saw improved hydration. 89% noticed reduced fine lines. 91% reported brighter skin.', highlight: '8-Week' },
          ].map((section) => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <button onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{section.title}</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{section.highlight}</span>
                </div>
                {expandedSection === section.id ? <ChevronUp size={18} className="text-green-500" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {expandedSection === section.id && (
                <div className="px-4 pb-4"><div className="p-3 bg-gray-50 rounded-xl"><p className="text-sm text-gray-600">{section.content}</p></div></div>
              )}
            </div>
          ))}
        </div>

        {/* Final Trust */}
        <div className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
          </div>
          <p className="text-sm text-gray-600">Rated 4.8/5 by 2,340+ customers</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span>FDA Approved</span>
            <span>Cruelty Free</span>
            <span>Made in India</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-500 p-3 z-50 shadow-2xl">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-lg">₹{getFinalPrepaidPrice()} <span className="text-sm text-gray-400 line-through">₹{MRP}</span></p>
            <p className="text-xs text-green-600">Free Shipping • COD Available</p>
          </div>
          <button onClick={() => { trackInitiateCheckout(PREPAID_PRICE); setStep('checkout'); }}
            className="py-3 px-8 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl text-lg shadow-lg">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingProductPage;
