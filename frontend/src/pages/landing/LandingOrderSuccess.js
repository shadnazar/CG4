/**
 * LandingOrderSuccess.js
 * Order success page within landing page funnel
 * URL: /{slug}/order-success/{orderId}
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Check, Package, Truck, Clock, Copy, Share2, Gift, Phone } from 'lucide-react';
import { useTracking } from '../../providers/TrackingProvider';
import { useLandingPage } from './LandingPageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function LandingOrderSuccess() {
  const { orderId } = useParams();
  const { trackAction, trackPurchase } = useTracking();
  const { slug, productName, productTagline, getHeroUrl } = useLandingPage();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API}/orders/${orderId}`);
        setOrder(res.data);
        
        // Track purchase
        trackPurchase(res.data.order_id, res.data.amount);
        trackAction('landing_order_complete', { slug, order_id: orderId, amount: res.data.amount });
        
        // Meta Pixel Purchase
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Purchase', {
            value: res.data.amount,
            currency: 'INR',
            content_name: productName,
            content_type: 'product',
            order_id: orderId,
            landing_page: slug
          });
        }

        // Google Ads conversion tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'conversion', {
            send_to: 'AW-16928253164/purchase',
            value: res.data.amount,
            currency: 'INR',
            transaction_id: orderId
          });
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, slug, productName, trackAction, trackPurchase]);

  const copyReferralLink = () => {
    if (order?.referral_link) {
      navigator.clipboard.writeText(order.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    if (order?.referral_link) {
      const text = `Hey! I just ordered ${productName} and it's amazing! Use my link to get ₹50 OFF: ${order.referral_link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-12 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-green-500" size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-green-100">Thank you for your purchase</p>
        <p className="text-sm mt-2 bg-white/20 inline-block px-4 py-1 rounded-full">
          Order ID: {orderId}
        </p>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Order Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Product</span>
              <span className="font-medium text-gray-900">{productName}</span>
            </div>
            {order && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-bold text-green-600">₹{order.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment</span>
                  <span className="font-medium text-gray-900">{order.payment_method}</span>
                </div>
                {order.payment_method?.includes('COD') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                    <p className="font-medium">Balance at Delivery: ₹{order.amount - 49}</p>
                    <p className="text-xs mt-1">₹29 advance paid • Balance due on delivery</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="text-green-500" size={20} />
            Delivery Information
          </h3>
          
          {order && (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{order.name}</p>
              <p className="text-gray-600">{order.house_number}, {order.area}</p>
              <p className="text-gray-600">{order.state} - {order.pincode}</p>
              <p className="text-gray-600 flex items-center gap-1">
                <Phone size={14} /> +91 {order.phone}
              </p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-dashed flex items-center gap-3 text-sm text-gray-600">
            <Clock size={16} className="text-green-500" />
            <span>Expected delivery in 2-3 business days</span>
          </div>
        </div>

        {/* Referral Card */}
        {order?.referral_link && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={24} />
              <h3 className="font-bold text-lg">Share & Earn ₹100!</h3>
            </div>
            <p className="text-purple-100 text-sm mb-4">
              Share your link with friends. When they order, you get ₹100 cashback!
            </p>
            
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 mb-3">
              <p className="text-xs text-purple-200 mb-1">Your Referral Link</p>
              <p className="text-sm font-medium truncate">{order.referral_link}</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={copyReferralLink}
                className="flex-1 py-3 bg-white text-purple-600 font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Track Order */}
        <Link
          to="/track-order"
          className="block w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl text-center hover:bg-gray-200 transition-colors"
        >
          Track Your Order
        </Link>

        {/* Continue Shopping */}
        <Link
          to={getHeroUrl()}
          className="block w-full py-4 bg-green-500 text-white font-semibold rounded-xl text-center hover:bg-green-600 transition-colors"
        >
          Back to {productName.split(' ').slice(0, 3).join(' ')}
        </Link>
      </div>
    </div>
  );
}

export default LandingOrderSuccess;
