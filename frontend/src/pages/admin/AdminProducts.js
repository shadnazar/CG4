import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Plus, Edit, Trash2, Image as ImageIcon, DollarSign, Eye, EyeOff, Save, X, ChevronDown, Tag, Settings, Layers, Upload, Trash, Clock, Rocket, GripVertical, ArrowUp, ArrowDown, ArrowLeft, LayoutDashboard } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Reusable image uploader/replacer
function ImageManager({ images = [], onChange, label = 'Images', single = false, headers }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file) => {
    if (!file) return null;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await axios.post(`${API}/admin/upload-image`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      return res.data.url;
    } catch (e) {
      alert(e.response?.data?.detail || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (!url) return;
    if (single) onChange(url);
    else onChange([...(images || []), url]);
    e.target.value = '';
  };

  const handleReplace = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (!url) return;
    const next = [...images];
    next[index] = url;
    onChange(next);
    e.target.value = '';
  };

  const handleRemove = (index) => {
    if (single) { onChange(''); return; }
    onChange(images.filter((_, i) => i !== index));
  };

  // Single-image mode (for hero banner / bundle hero)
  if (single) {
    const url = images;
    return (
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1.5">{label}</label>
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
            {url ? <img src={url} alt="" className="w-full h-full object-cover" data-testid="single-image-preview" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}
          </div>
          <div className="flex flex-col gap-1.5">
            <input type="file" accept="image/*" ref={fileRef} onChange={handleAdd} className="hidden" data-testid={`upload-${label}`} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
              <Upload size={12} /> {uploading ? 'Uploading...' : (url ? 'Replace' : 'Upload')}
            </button>
            {url && <button type="button" onClick={() => onChange('')} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold"><Trash size={12} /> Remove</button>}
          </div>
        </div>
      </div>
    );
  }

  // Multi-image mode (product images)
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1.5">{label} ({images?.length || 0})</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {(images || []).map((url, i) => (
          <div key={i} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <label className="cursor-pointer p-1.5 bg-white rounded-lg shadow-md" title="Replace">
                <Upload size={12} className="text-gray-700" />
                <input type="file" accept="image/*" onChange={(e) => handleReplace(i, e)} className="hidden" />
              </label>
              <button type="button" onClick={() => handleRemove(i)} className="p-1.5 bg-white rounded-lg shadow-md" title="Remove"><Trash size={12} className="text-red-600" /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors text-xs">
          <Upload size={18} />
          <span>{uploading ? 'Uploading...' : 'Add'}</span>
        </button>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleAdd} className="hidden" />
      </div>
    </div>
  );
}

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [editProduct, setEditProduct] = useState(null);
  const [editCombo, setEditCombo] = useState(null);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_type: 'percentage', discount_value: 10, min_order_amount: 0, max_uses: 100, expiry_days: 30 });
  const [editSettings, setEditSettings] = useState(null);
  const [concerns, setConcerns] = useState([]);
  const [categories, setCategories] = useState([]);
  const adminToken = sessionStorage.getItem('adminToken');

  const headers = { 'X-Admin-Token': adminToken };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, c, cp, s, cn, ct] = await Promise.all([
        axios.get(`${API}/products?active_only=false`, { headers }),
        axios.get(`${API}/combos?active_only=false`, { headers }),
        axios.get(`${API}/admin/coupons`, { headers }),
        axios.get(`${API}/site-settings`),
        axios.get(`${API}/concerns`),
        axios.get(`${API}/categories`),
      ]);
      setProducts(p.data);
      setCombos(c.data);
      setCoupons(cp.data);
      setSettings(s.data);
      setConcerns(cn.data || []);
      setCategories(ct.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    if (!adminToken) { navigate('/admin'); return; }
    fetchAll();
  }, []);

  const updateProduct = async (slug, data) => {
    try {
      await axios.put(`${API}/admin/products/${slug}`, data, { headers });
      fetchAll();
      setEditProduct(null);
    } catch (err) { alert(err.response?.data?.detail || 'Update failed'); }
  };

  const toggleProductActive = async (slug, isActive) => {
    await updateProduct(slug, { is_active: !isActive });
  };

  const updateCombo = async (comboId, data) => {
    try {
      await axios.put(`${API}/admin/combos/${comboId}`, data, { headers });
      fetchAll();
      setEditCombo(null);
    } catch (err) { alert('Update failed'); }
  };

  const createCoupon = async () => {
    if (!newCoupon.code.trim()) return;
    try {
      await axios.post(`${API}/admin/coupons`, { ...newCoupon, code: newCoupon.code.toUpperCase() }, { headers });
      setNewCoupon({ code: '', discount_type: 'percentage', discount_value: 10, min_order_amount: 0, max_uses: 100, expiry_days: 30 });
      fetchAll();
    } catch (err) { alert('Coupon creation failed'); }
  };

  const deleteCoupon = async (code) => {
    if (!window.confirm('Delete this coupon?')) return;
    await axios.delete(`${API}/admin/coupons/${code}`, { headers });
    fetchAll();
  };

  const updateSiteSettings = async () => {
    try {
      await axios.put(`${API}/admin/site-settings`, editSettings, { headers });
      setEditSettings(null);
      fetchAll();
    } catch (err) { alert('Update failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  const tabs = [
    { key: 'products', label: 'Products', icon: Package },
    { key: 'banners', label: 'Banners', icon: ImageIcon },
    { key: 'combos', label: 'Combos', icon: Layers },
    { key: 'coupons', label: 'Coupons', icon: Tag },
    { key: 'settings', label: 'Site Settings', icon: Settings },
  ];

  // Helper: toggle a product's TBL status quickly (without entering edit mode)
  const toggleTbl = async (slug, current) => {
    try {
      const newStatus = !current;
      await axios.put(`${API}/admin/products/${slug}/launch-status`,
        { is_to_be_launched: newStatus, preorder_enabled: newStatus },
        { headers });
      fetchAll();
    } catch (err) { alert(err.response?.data?.detail || 'Failed to toggle launch status'); }
  };

  return (
    <div className="space-y-6" data-testid="admin-products">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-green-500 hover:text-green-700 text-gray-700 transition-colors text-sm font-semibold shadow-sm"
            title="Back to dashboard"
            data-testid="admin-back-btn"
          >
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">Catalog Management</h1>
            <p className="text-gray-500 text-sm">{products.length} products · {combos.length} combos · {coupons.length} coupons</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium"
            title="Open dashboard"
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} data-testid={`tab-${tab.key}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.slug} className={`bg-white rounded-2xl border ${product.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50/50'} p-4`} data-testid={`admin-product-${product.slug}`}>
              {editProduct?.slug === product.slug ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="text-xs font-semibold text-gray-500">Product Name</label><input value={editProduct.name} onChange={e => setEditProduct({...editProduct, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">Short Name</label><input value={editProduct.short_name} onChange={e => setEditProduct({...editProduct, short_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">MRP (₹)</label><input type="number" value={editProduct.mrp} onChange={e => setEditProduct({...editProduct, mrp: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">Prepaid Price (₹)</label><input type="number" value={editProduct.prepaid_price} onChange={e => setEditProduct({...editProduct, prepaid_price: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">COD Price (₹)</label><input type="number" value={editProduct.cod_price} onChange={e => setEditProduct({...editProduct, cod_price: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">COD Advance (₹)</label><input type="number" value={editProduct.cod_advance} onChange={e => setEditProduct({...editProduct, cod_advance: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">Discount %</label><input type="number" value={editProduct.discount_percent} onChange={e => setEditProduct({...editProduct, discount_percent: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">Badge</label><input value={editProduct.badge || ''} onChange={e => setEditProduct({...editProduct, badge: e.target.value})} placeholder="Bestseller, New Launch..." className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  </div>
                  <div><label className="text-xs font-semibold text-gray-500">Tagline</label><input value={editProduct.tagline || ''} onChange={e => setEditProduct({...editProduct, tagline: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-semibold text-gray-500">Description</label><textarea value={editProduct.description || ''} onChange={e => setEditProduct({...editProduct, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} /></div>
                  <ImageManager images={editProduct.images || []} onChange={(imgs) => setEditProduct({...editProduct, images: imgs})} label="Product Images" headers={headers} />

                  {/* Category + Concerns assignment */}
                  <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-pink-700" />
                      <span className="text-xs font-bold text-pink-900 tracking-wide">NICHE · CATEGORY · CONCERNS</span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Niche (top-level 3-pill destination)</label>
                      <select
                        value={editProduct.niche || 'anti-aging'}
                        onChange={e => setEditProduct({ ...editProduct, niche: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        data-testid="edit-product-niche"
                      >
                        <option value="anti-aging">✨ Anti-Aging (flagship brand)</option>
                        <option value="skincare">💧 Skincare</option>
                        <option value="cosmetics">💄 Cosmetics &amp; Makeup</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
                      <select
                        value={editProduct.category || ''}
                        onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        data-testid="edit-product-category"
                      >
                        <option value="">— Select category —</option>
                        {categories.map(c => (
                          <option key={c.slug} value={c.slug}>{c.icon} {c.name} ({c.group})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Skin Concerns (multi-select)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {concerns.map(cn => {
                          const selected = (editProduct.concerns || []).includes(cn.slug);
                          return (
                            <button
                              key={cn.slug}
                              type="button"
                              onClick={() => {
                                const cur = editProduct.concerns || [];
                                const next = selected ? cur.filter(s => s !== cn.slug) : [...cur, cn.slug];
                                setEditProduct({ ...editProduct, concerns: next });
                              }}
                              className={`text-xs font-bold px-2.5 py-1.5 rounded-full border transition-all ${selected ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'}`}
                              data-testid={`edit-product-concern-${cn.slug}`}
                            >
                              {cn.icon} {cn.name}
                            </button>
                          );
                        })}
                      </div>
                      {(!editProduct.concerns || editProduct.concerns.length === 0) && (
                        <p className="text-[11px] text-amber-700 mt-1.5">⚠️ No concerns selected — this product won't appear on any concern page.</p>
                      )}
                    </div>
                  </div>

                  {/* TBL / Preorder Controls */}
                  <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-purple-700" />
                      <span className="text-xs font-bold text-purple-900 tracking-wide">LAUNCH STATUS</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditProduct({
                          ...editProduct,
                          is_to_be_launched: !editProduct.is_to_be_launched,
                          launch_date: !editProduct.is_to_be_launched
                            ? (editProduct.launch_date || new Date(Date.now() + 25*86400000).toISOString())
                            : null,
                          preorder_enabled: !editProduct.is_to_be_launched ? true : false,
                        })}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${editProduct.is_to_be_launched ? 'bg-purple-600 text-white' : 'bg-green-100 text-green-800'}`}
                        data-testid="tbl-toggle"
                      >
                        {editProduct.is_to_be_launched ? 'TBL — To Be Launched' : 'Live — Available Now'}
                      </button>
                      {editProduct.is_to_be_launched && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-gray-600">Launch:</label>
                            <input
                              type="date"
                              value={editProduct.launch_date ? editProduct.launch_date.slice(0, 10) : ''}
                              onChange={e => setEditProduct({ ...editProduct, launch_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                              className="px-2 py-1.5 border rounded-lg text-xs"
                              data-testid="tbl-launch-date"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditProduct({ ...editProduct, preorder_enabled: !editProduct.preorder_enabled })}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${editProduct.preorder_enabled ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                            data-testid="preorder-toggle"
                          >
                            Preorder: {editProduct.preorder_enabled ? 'ON' : 'OFF'}
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      When TBL: customers see "Coming Soon" + countdown. With Preorder ON, they can place a preorder.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateProduct(product.slug, editProduct)} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"><Save size={14} /> Save</button>
                    <button onClick={() => setEditProduct(null)} className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"><X size={14} /> Cancel</button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{product.name}</h3>
                      {product.is_to_be_launched && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold flex items-center gap-1">
                          <Clock size={10} /> TBL{product.days_to_launch != null ? ` · ${product.days_to_launch}d` : ''}
                        </span>
                      )}
                      {product.badge && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">{product.badge}</span>}
                      {!product.is_active && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{product.key_ingredients} | {product.size}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="font-bold text-gray-900">Prepaid: ₹{product.prepaid_price}</span>
                      <span className="text-gray-500">COD: ₹{product.cod_price}</span>
                      <span className="text-gray-400 line-through">MRP: ₹{product.mrp}</span>
                      <span className="text-green-600 text-xs font-bold">{product.discount_percent}% OFF</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleTbl(product.slug, product.is_to_be_launched)}
                      className={`p-2 rounded-lg ${product.is_to_be_launched ? 'bg-green-50 hover:bg-green-100 text-green-700' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'}`}
                      title={product.is_to_be_launched ? 'Mark as Launched' : 'Mark as TBL (To Be Launched)'}
                      data-testid={`quick-tbl-${product.slug}`}
                    >
                      {product.is_to_be_launched ? <Rocket size={16} /> : <Clock size={16} />}
                    </button>
                    <button onClick={() => setEditProduct({...product})} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit"><Edit size={16} className="text-gray-500" /></button>
                    <button onClick={() => toggleProductActive(product.slug, product.is_active)} className="p-2 hover:bg-gray-100 rounded-lg" title={product.is_active ? 'Deactivate' : 'Activate'}>
                      {product.is_active ? <Eye size={16} className="text-green-500" /> : <EyeOff size={16} className="text-red-500" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Banners Tab — Multi-banner Hero Carousel manager */}
      {activeTab === 'banners' && (
        <BannerCarouselManager
          settings={settings}
          headers={headers}
          onSaved={fetchAll}
        />
      )}

      {/* Combos Tab */}
      {activeTab === 'combos' && (
        <div className="space-y-4">
          {combos.map(combo => (
            <div key={combo.combo_id} className="bg-white rounded-2xl border border-gray-200 p-4" data-testid={`admin-combo-${combo.combo_id}`}>
              {editCombo?.combo_id === combo.combo_id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-semibold text-gray-500">Name</label><input value={editCombo.name} onChange={e => setEditCombo({...editCombo, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">Badge</label><input value={editCombo.badge || ''} onChange={e => setEditCombo({...editCombo, badge: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">MRP Total (₹)</label><input type="number" value={editCombo.mrp_total} onChange={e => setEditCombo({...editCombo, mrp_total: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">Prepaid Price (₹)</label><input type="number" value={editCombo.combo_prepaid_price} onChange={e => setEditCombo({...editCombo, combo_prepaid_price: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">COD Price (₹)</label><input type="number" value={editCombo.combo_cod_price} onChange={e => setEditCombo({...editCombo, combo_cod_price: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-500">Discount %</label><input type="number" value={editCombo.discount_percent} onChange={e => setEditCombo({...editCombo, discount_percent: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  </div>
                  <div><label className="text-xs font-semibold text-gray-500">Description</label><textarea value={editCombo.description || ''} onChange={e => setEditCombo({...editCombo, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>

                  {/* Image upload for combo */}
                  <ImageManager
                    images={editCombo.image || ''}
                    onChange={(url) => setEditCombo({...editCombo, image: url})}
                    label="Combo Image (kit packaging shot)"
                    single
                    headers={headers}
                  />

                  {/* TBL controls for combos */}
                  <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-purple-700" />
                      <span className="text-xs font-bold text-purple-900 tracking-wide">LAUNCH STATUS</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditCombo({
                          ...editCombo,
                          is_to_be_launched: !editCombo.is_to_be_launched,
                          launch_date: !editCombo.is_to_be_launched
                            ? (editCombo.launch_date || new Date(Date.now() + 25 * 86400000).toISOString())
                            : null,
                          preorder_enabled: !editCombo.is_to_be_launched ? true : false,
                        })}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${editCombo.is_to_be_launched ? 'bg-purple-600 text-white' : 'bg-green-100 text-green-800'}`}
                        data-testid={`combo-tbl-toggle-${combo.combo_id}`}
                      >
                        {editCombo.is_to_be_launched ? 'TBL — To Be Launched' : 'Live — Available Now'}
                      </button>
                      {editCombo.is_to_be_launched && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-gray-600">Launch:</label>
                            <input
                              type="date"
                              value={editCombo.launch_date ? editCombo.launch_date.slice(0, 10) : ''}
                              onChange={e => setEditCombo({...editCombo, launch_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                              className="px-2 py-1.5 border rounded-lg text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditCombo({...editCombo, preorder_enabled: !editCombo.preorder_enabled})}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${editCombo.preorder_enabled ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                          >
                            Preorder: {editCombo.preorder_enabled ? 'ON' : 'OFF'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => updateCombo(combo.combo_id, editCombo)} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"><Save size={14} /> Save</button>
                    <button onClick={() => setEditCombo(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  {combo.image && <img src={combo.image} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-gray-100" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{combo.name}</h3>
                      {combo.is_to_be_launched && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold flex items-center gap-1">
                          <Clock size={10} /> TBL{combo.days_to_launch != null ? ` · ${combo.days_to_launch}d` : ''}
                        </span>
                      )}
                      {combo.badge && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">{combo.badge}</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">{combo.product_slugs?.join(', ')} | {combo.discount_percent}% OFF</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">Prepaid: ₹{combo.combo_prepaid_price} | COD: ₹{combo.combo_cod_price} <span className="text-gray-400 line-through ml-2">MRP: ₹{combo.mrp_total}</span></p>
                  </div>
                  <button onClick={() => setEditCombo({...combo})} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"><Edit size={16} className="text-gray-500" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Create Coupon</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <input value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="Code (e.g., SAVE10)" className="px-3 py-2 border rounded-lg text-sm" />
              <select value={newCoupon.discount_type} onChange={e => setNewCoupon({...newCoupon, discount_type: e.target.value})} className="px-3 py-2 border rounded-lg text-sm">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input type="number" value={newCoupon.discount_value} onChange={e => setNewCoupon({...newCoupon, discount_value: Number(e.target.value)})} placeholder="Value" className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" value={newCoupon.min_order_amount} onChange={e => setNewCoupon({...newCoupon, min_order_amount: Number(e.target.value)})} placeholder="Min order ₹" className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" value={newCoupon.max_uses} onChange={e => setNewCoupon({...newCoupon, max_uses: Number(e.target.value)})} placeholder="Max uses" className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" value={newCoupon.expiry_days} onChange={e => setNewCoupon({...newCoupon, expiry_days: Number(e.target.value)})} placeholder="Expiry (days)" className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button onClick={createCoupon} className="mt-3 flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"><Plus size={14} /> Create Coupon</button>
          </div>
          {coupons.map(coupon => (
            <div key={coupon.code} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-gray-900 text-lg">{coupon.code}</span>
                <p className="text-sm text-gray-500 mt-1">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                  {coupon.min_order_amount > 0 && ` | Min ₹${coupon.min_order_amount}`}
                  {` | Used: ${coupon.used_count || 0}/${coupon.max_uses}`}
                </p>
              </div>
              <button onClick={() => deleteCoupon(coupon.code)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Site Settings</h3>
          {editSettings ? (
            <>
              <div><label className="text-xs font-semibold text-gray-500">Hero Title</label><input value={editSettings.hero_title || ''} onChange={e => setEditSettings({...editSettings, hero_title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-gray-500">Hero Subtitle</label><textarea value={editSettings.hero_subtitle || ''} onChange={e => setEditSettings({...editSettings, hero_subtitle: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
              <ImageManager images={editSettings.hero_banner_image || ''} onChange={(url) => setEditSettings({...editSettings, hero_banner_image: url})} label="Hero Banner Image (under main heading)" single headers={headers} />
              <ImageManager images={editSettings.bundle_hero_image || ''} onChange={(url) => setEditSettings({...editSettings, bundle_hero_image: url})} label="Bundle Kit Image (Complete Anti-Aging Kit)" single headers={headers} />

              {/* NEW: Homepage Feature Banner (replaces 3-product side panel on hero) */}
              <div className="rounded-xl border border-green-100 bg-green-50/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon size={14} className="text-green-700" />
                  <span className="text-xs font-bold text-green-900 tracking-wide">HOMEPAGE FEATURE BANNER (right of "India's #1" section)</span>
                </div>
                <ImageManager images={editSettings.homepage_feature_image || ''} onChange={(url) => setEditSettings({...editSettings, homepage_feature_image: url})} label="Landscape Feature Image" single headers={headers} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><label className="text-xs font-semibold text-gray-500">Feature Title</label><input value={editSettings.homepage_feature_title || ''} onChange={e => setEditSettings({...editSettings, homepage_feature_title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., Complete Skin Renewal System" /></div>
                  <div><label className="text-xs font-semibold text-gray-500">Feature Subtitle</label><input value={editSettings.homepage_feature_subtitle || ''} onChange={e => setEditSettings({...editSettings, homepage_feature_subtitle: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., 5 clinical products. One transformation." /></div>
                </div>
              </div>
              <div><label className="text-xs font-semibold text-gray-500">COD Advance Amount (₹)</label><input type="number" value={editSettings.cod_advance_amount || 29} onChange={e => setEditSettings({...editSettings, cod_advance_amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-500">Pre-Sale Mode</label>
                <button onClick={() => setEditSettings({...editSettings, presale_enabled: !editSettings.presale_enabled})} className={`px-4 py-1.5 rounded-full text-sm font-bold ${editSettings.presale_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {editSettings.presale_enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
              {editSettings.presale_enabled && (
                <>
                  <div><label className="text-xs font-semibold text-gray-500">Pre-Sale Title</label><input value={editSettings.presale_title || ''} onChange={e => setEditSettings({...editSettings, presale_title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-semibold text-gray-500">Pre-Sale Badge</label><input value={editSettings.presale_badge || ''} onChange={e => setEditSettings({...editSettings, presale_badge: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-semibold text-gray-500">Pre-Sale Price (₹)</label><input type="number" value={editSettings.presale_price || ''} onChange={e => setEditSettings({...editSettings, presale_price: Number(e.target.value)})} placeholder="e.g., 2 or 20" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                </>
              )}
              <div className="flex gap-2">
                <button onClick={updateSiteSettings} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"><Save size={14} /> Save</button>
                <button onClick={() => setEditSettings(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Hero Title</p><p className="font-medium">{settings.hero_title || 'Not set'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">COD Advance</p><p className="font-medium">₹{settings.cod_advance_amount || 29}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Pre-Sale</p><p className="font-medium">{settings.presale_enabled ? 'ENABLED' : 'Disabled'}</p></div>
              </div>
              <button onClick={() => setEditSettings({...settings})} className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold"><Edit size={14} /> Edit Settings</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Banner Carousel Manager
   - List existing banners
   - Add new (upload image, set title/subtitle/CTA)
   - Reorder (move up/down)
   - Delete
   - Set autoplay interval
   ============================================================ */
function BannerCarouselManager({ settings, headers, onSaved }) {
  const API = process.env.REACT_APP_BACKEND_URL;
  const [banners, setBanners] = useState([]);
  const [autoplayMs, setAutoplayMs] = useState(2000);
  const [draft, setDraft] = useState({ image: '', title: '', subtitle: '', cta_text: 'Shop Now', cta_link: '/shop' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const sorted = (settings?.banner_carousel || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setBanners(sorted);
    setAutoplayMs(settings?.carousel_autoplay_ms || 2000);
  }, [settings]);

  const persist = async (newBanners, newAutoplay) => {
    try {
      const ordered = newBanners.map((b, i) => ({ ...b, sort_order: i + 1 }));
      await axios.put(`${API}/admin/site-settings`,
        { banner_carousel: ordered, carousel_autoplay_ms: newAutoplay ?? autoplayMs },
        { headers });
      onSaved();
    } catch (err) { alert(err.response?.data?.detail || 'Save failed'); }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/admin/upload-image`, fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setDraft(d => ({ ...d, image: res.data.url }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed');
    }
    setUploading(false);
  };

  const addBanner = async () => {
    if (!draft.image) { alert('Please upload an image first'); return; }
    const newBanner = {
      id: `banner-${Date.now()}`,
      image: draft.image,
      title: draft.title || '',
      subtitle: draft.subtitle || '',
      cta_text: draft.cta_text || '',
      cta_link: draft.cta_link || '/shop',
      sort_order: banners.length + 1,
    };
    const updated = [...banners, newBanner];
    setBanners(updated);
    await persist(updated);
    setDraft({ image: '', title: '', subtitle: '', cta_text: 'Shop Now', cta_link: '/shop' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const deleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    const updated = banners.filter(b => b.id !== id);
    setBanners(updated);
    await persist(updated);
  };

  const moveBanner = async (id, dir) => {
    const idx = banners.findIndex(b => b.id === id);
    const target = idx + dir;
    if (target < 0 || target >= banners.length) return;
    const updated = [...banners];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setBanners(updated);
    await persist(updated);
  };

  const updateBannerField = (id, field, value) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const saveBannerEdits = async () => { await persist(banners); };

  return (
    <div className="space-y-5" data-testid="banner-manager">
      {/* Settings row */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-green-600" />
          <h3 className="font-bold text-gray-900">Hero Banner Carousel</h3>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Autoplay (ms):</label>
          <input
            type="number"
            min="1500"
            step="500"
            value={autoplayMs}
            onChange={e => setAutoplayMs(Number(e.target.value))}
            onBlur={() => persist(banners, autoplayMs)}
            className="w-24 px-2 py-1.5 border rounded-lg text-sm"
            data-testid="banner-autoplay-input"
          />
        </div>
      </div>

      {/* Add new banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Plus size={16} /> Add New Banner</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500">Image</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload(e.target.files?.[0])}
                className="text-xs flex-1"
                data-testid="banner-upload-input"
              />
              {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
            </div>
            {draft.image && (
              <div className="mt-2 relative">
                <img src={draft.image} alt="preview" className="w-full h-32 object-cover rounded-lg border border-gray-100" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div><label className="text-xs font-semibold text-gray-500">Title</label><input value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} placeholder="e.g., Clinically Proven Anti-Aging" className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="banner-title-input" /></div>
            <div><label className="text-xs font-semibold text-gray-500">Subtitle</label><input value={draft.subtitle} onChange={e => setDraft({...draft, subtitle: e.target.value})} placeholder="e.g., Visible results in 4 weeks" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-semibold text-gray-500">CTA Text</label><input value={draft.cta_text} onChange={e => setDraft({...draft, cta_text: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-semibold text-gray-500">CTA Link</label><input value={draft.cta_link} onChange={e => setDraft({...draft, cta_link: e.target.value})} placeholder="/shop" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            </div>
          </div>
        </div>
        <button onClick={addBanner} disabled={uploading || !draft.image} className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold flex items-center gap-1" data-testid="banner-add-btn">
          <Plus size={14} /> Add Banner
        </button>
      </div>

      {/* Existing banners list */}
      {banners.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center text-sm text-amber-800">
          No banners yet. Add at least one to populate the homepage hero carousel.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row gap-4 items-start" data-testid={`banner-item-${i}`}>
              <img src={b.image} alt={b.title} className="w-full md:w-44 h-28 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <div><label className="text-xs font-semibold text-gray-500">Title</label><input value={b.title || ''} onChange={e => updateBannerField(b.id, 'title', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-xs font-semibold text-gray-500">Subtitle</label><input value={b.subtitle || ''} onChange={e => updateBannerField(b.id, 'subtitle', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-xs font-semibold text-gray-500">CTA Text</label><input value={b.cta_text || ''} onChange={e => updateBannerField(b.id, 'cta_text', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-xs font-semibold text-gray-500">CTA Link</label><input value={b.cta_link || ''} onChange={e => updateBannerField(b.id, 'cta_link', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="flex md:flex-col gap-1 flex-shrink-0">
                <button onClick={() => moveBanner(b.id, -1)} disabled={i === 0} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40" title="Move up"><ArrowUp size={14} /></button>
                <button onClick={() => moveBanner(b.id, 1)} disabled={i === banners.length - 1} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40" title="Move down"><ArrowDown size={14} /></button>
                <button onClick={saveBannerEdits} className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700" title="Save edits"><Save size={14} /></button>
                <button onClick={() => deleteBanner(b.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
