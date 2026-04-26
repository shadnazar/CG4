import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Trash2, Minus, Plus, ChevronRight, Shield, Truck, Tag, ArrowLeft, Sparkles, Zap, Award, Check, Clock, Star, Lock, Package } from 'lucide-react';
import { getCart, saveCart } from './Homepage';
import { useTracking } from '../providers/TrackingProvider';

const API = process.env.REACT_APP_BACKEND_URL;

function CartPage() {
  const navigate = useNavigate();
  const { trackAction } = useTracking();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [upsellProducts, setUpsellProducts] = useState([]);
  const [combos, setCombos] = useState([]);

  const appliedCouponRef = React.useRef(appliedCoupon);
  appliedCouponRef.current = appliedCoupon;
  const initialLoadRef = React.useRef(true);

  const validateCart = useCallback(async (couponOverride) => {
    if (initialLoadRef.current) setLoading(true);
    const cart = getCart();
    if (!cart.items.length) { setCartData(null); setLoading(false); initialLoadRef.current = false; return; }
    const couponCodeToUse = couponOverride !== undefined ? couponOverride : (appliedCouponRef.current?.code || null);
    try {
      const res = await axios.post(`${API}/api/cart/validate`, { items: cart.items, coupon_code: couponCodeToUse, payment_method: 'prepaid' });
      setCartData(res.data);
      if (initialLoadRef.current) {
        const [allProds, comboRes] = await Promise.all([axios.get(`${API}/api/products`), axios.get(`${API}/api/combos`)]);
        const cartSlugs = cart.items.map(i => i.product_slug).filter(Boolean);
        const cartCombos = cart.items.map(i => i.combo_id).filter(Boolean);
        setUpsellProducts(allProds.data.filter(p => !cartSlugs.includes(p.slug)));
        setCombos(comboRes.data.filter(c => !cartCombos.includes(c.combo_id)));
      }
    } catch (err) { console.error(err); }
    setLoading(false);
    initialLoadRef.current = false;
  }, []);

  useEffect(() => { validateCart(); }, []);

  const updateQuantity = (index, delta) => { const cart = getCart(); cart.items[index].quantity = Math.max(1, (cart.items[index].quantity || 1) + delta); saveCart(cart); validateCart(); };
  const removeItem = (index) => { const cart = getCart(); cart.items.splice(index, 1); saveCart(cart); validateCart(); };
  const addUpsellToCart = (slug) => { const cart = getCart(); const e = cart.items.find(i => i.product_slug === slug); if (e) e.quantity += 1; else cart.items.push({ product_slug: slug, quantity: 1 }); saveCart(cart); validateCart(); };

  const applyCouponCode = async (code) => {
    setCouponError('');
    if (!code?.trim()) return;
    try {
      const r = await axios.post(`${API}/api/validate-coupon?code=${code.trim()}&cart_total=${cartData?.subtotal || 0}`);
      const newCoupon = { code: code.trim().toUpperCase(), ...r.data };
      setAppliedCoupon(newCoupon);
      // Re-validate cart with the new coupon so totals/discount lines update
      await validateCart(newCoupon.code);
    } catch (e) {
      setCouponError(e.response?.data?.detail || 'Invalid coupon');
      setAppliedCoupon(null);
    }
  };

  const applyCoupon = () => applyCouponCode(couponCode);

  const removeCoupon = async () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    await validateCart(null);
  };

  const proceedToCheckout = () => {
    if (!cartData?.items?.length) return;
    trackAction('initiate_checkout', { items: cartData.items.length, total: cartData.total });
    if (window.fbq) window.fbq('track', 'InitiateCheckout', { value: cartData.total, currency: 'INR', num_items: cartData.item_count });
    navigate('/checkout', { state: { cartData, paymentMethod: 'prepaid', coupon: appliedCoupon } });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!cartData || !cartData.items?.length) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4" data-testid="empty-cart">
        <div className="text-center"><ShoppingCart className="w-14 h-14 mx-auto mb-4 text-gray-200" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mb-6">Explore our anti-aging range to get started.</p>
        <Link to="/shop" className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-green-700 inline-flex items-center gap-2">Shop Now <ChevronRight size={16} /></Link></div>
      </div>
    );
  }

  const kit = combos.find(c => c.combo_id === 'complete-anti-aging-kit');

  return (
    <div className="min-h-screen bg-stone-50" data-testid="cart-page">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/shop" className="p-2 hover:bg-white rounded-xl transition-colors"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-xs text-gray-400">{cartData.item_count} {cartData.item_count === 1 ? 'item' : 'items'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            {/* Items */}
            {cartData.items.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-3.5" data-testid={`cart-item-${index}`}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image ? <img src={item.image} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" /> : <Package size={20} className="text-green-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.type === 'combo' ? item.name : item.short_name || item.name}</h3>
                  {item.type === 'combo' && <p className="text-xs text-green-600 font-medium">{item.product_slugs?.length} products included</p>}
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold text-gray-900">₹{item.price}</span>
                    {(item.mrp || item.mrp_total) > item.price && <span className="text-xs text-gray-400 line-through">₹{item.mrp || item.mrp_total}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-sm">
                      <button onClick={() => updateQuantity(index, -1)} className="px-2.5 py-1.5 text-gray-400 hover:text-gray-900"><Minus size={14} /></button>
                      <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, 1)} className="px-2.5 py-1.5 text-gray-400 hover:text-gray-900"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeItem(index)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    <span className="ml-auto font-bold text-gray-900">₹{item.line_total}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Bundle Push */}
            {kit && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/60">
                <div className="flex items-center gap-2 mb-2"><Award size={15} className="text-amber-600" /><span className="text-xs font-bold text-amber-800 tracking-wide">UPGRADE & SAVE {kit.discount_percent}%</span></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{kit.name}</p>
                    <p className="text-xs mt-0.5"><span className="font-bold text-green-700">₹{kit.combo_prepaid_price?.toLocaleString()}</span> <span className="text-gray-400 line-through text-xs">₹{kit.mrp_total?.toLocaleString()}</span></p>
                  </div>
                  <button onClick={() => { const c = getCart(); c.items = [{ combo_id: kit.combo_id, quantity: 1 }]; saveCart(c); validateCart(); }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm">Switch to Kit</button>
                </div>
              </div>
            )}

            {/* Upsell with images — click goes to product page */}
            {upsellProducts.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">Frequently Bought Together</p>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {upsellProducts.slice(0, 4).map(p => (
                    <div key={p.slug} className="flex-shrink-0 w-28 text-center">
                      <Link to={`/product/${p.slug}`}>
                        <div className="w-20 h-20 mx-auto bg-stone-50 rounded-xl flex items-center justify-center mb-1.5 overflow-hidden hover:shadow-md transition-shadow">
                          {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-16 h-16 object-contain" /> : <Sparkles size={16} className="text-green-300" />}
                        </div>
                      </Link>
                      <Link to={`/product/${p.slug}`}><p className="text-xs font-semibold text-gray-800 line-clamp-1 hover:text-green-700">{p.short_name}</p></Link>
                      <p className="text-xs text-gray-500">₹{p.prepaid_price}</p>
                      <button onClick={() => addUpsellToCart(p.slug)} className="mt-1.5 w-full bg-green-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-green-700">+ Add</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Coupons — show 3-4, apply on tap */}
            {!appliedCoupon && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-sm font-bold text-gray-900 mb-3">Available Coupons</p>
                <div className="space-y-2">
                  {[
                    { code: 'WELCOME50', desc: '₹50 OFF on orders above ₹499', color: 'orange' },
                    { code: 'FEB25', desc: '₹25 OFF — February Special', color: 'purple' },
                    { code: 'GLOW10', desc: '10% OFF on orders above ₹999', color: 'rose' },
                  ].map(c => (
                    <div key={c.code} className={`bg-${c.color}-50 border border-${c.color}-200 rounded-xl p-3 flex items-center justify-between`}>
                      <div>
                        <p className="text-sm font-bold font-mono text-gray-900">{c.code}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                      </div>
                      <button onClick={() => applyCouponCode(c.code)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0">Apply</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Bar */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100">
              <div className="grid grid-cols-3 gap-3">
                {[{ icon: Lock, t: '256-bit Secure', d: 'SSL Encrypted' }, { icon: Truck, t: 'Free Shipping', d: 'All India Delivery' }, { icon: Clock, t: '30-Day Return', d: 'Money Back Guarantee' }].map((b, i) => (
                  <div key={i} className="text-center">
                    <div className="w-9 h-9 mx-auto mb-1.5 bg-white rounded-xl flex items-center justify-center shadow-sm"><b.icon size={16} className="text-green-600" /></div>
                    <p className="text-xs font-bold text-gray-800">{b.t}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Review */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">Customers Love Us</p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">R</div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={10} className="fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-xs text-gray-600">"Best anti-aging products I've ever used. Visible results in 2 weeks!"</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ritika M., Mumbai | Verified Purchase</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Column */}
          <div className="space-y-3">
            {cartData.savings > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-3.5 text-center text-white shadow-lg shadow-green-200/30">
                <p className="text-sm font-bold">You're saving ₹{cartData.savings?.toLocaleString()}</p>
                <p className="text-xs text-green-100">on this order</p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">Have a Coupon?</p>
              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <div><p className="font-bold text-green-700 text-sm">{appliedCoupon.code}</p><p className="text-xs text-green-600">Saving ₹{appliedCoupon.discount}</p></div>
                  <button onClick={removeCoupon} className="text-gray-400 text-xs hover:text-red-500">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-green-200" />
                  <button onClick={applyCoupon} className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800">Apply</button>
                </div>
              )}
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm" data-testid="order-summary">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">Order Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400"><span>MRP</span><span className="line-through">₹{cartData.mrp_total?.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-700"><span>Subtotal</span><span className="font-medium">₹{cartData.subtotal?.toLocaleString()}</span></div>
                {cartData.discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-₹{cartData.discount}</span></div>}
                {cartData.volume_discount > 0 && <div className="flex justify-between text-purple-600"><span>Volume Discount ({cartData.volume_discount_percent}%)</span><span>-₹{cartData.volume_discount}</span></div>}
                <div className="flex justify-between text-gray-400"><span>Shipping</span><span className="text-green-600 font-medium">FREE</span></div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-gray-900 text-lg"><span>Total</span><span>₹{cartData.total?.toLocaleString()}</span></div>
              </div>
            </div>

            <button onClick={proceedToCheckout} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl text-base shadow-xl shadow-green-200/40 transition-all" data-testid="proceed-checkout-btn">
              Proceed to Checkout
            </button>

            {/* Social Proof Badges */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-xl p-3 text-center border border-amber-100/60">
                <p className="text-xl font-black text-amber-700">127</p>
                <p className="text-xs text-amber-600 font-semibold tracking-wide">ORDERS TODAY</p>
              </div>
              <div className="bg-gradient-to-b from-rose-50 to-pink-50 rounded-xl p-3 text-center border border-rose-100/60">
                <p className="text-xl font-black text-rose-700">4.8</p>
                <p className="text-xs text-rose-600 font-semibold tracking-wide">AVG RATING</p>
              </div>
              <div className="bg-gradient-to-b from-purple-50 to-violet-50 rounded-xl p-3 text-center border border-purple-100/60">
                <p className="text-xl font-black text-purple-700">50K+</p>
                <p className="text-xs text-purple-600 font-semibold tracking-wide">CUSTOMERS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
