/**
 * LandingHero.js
 * Landing page that looks EXACTLY like the main Homepage
 * But with dynamic content based on problem/category
 * URL: /{slug}
 */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, ChevronRight, ChevronDown, ChevronUp, Clock, Users, ShieldCheck, Truck, Flame, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import DermatologistSection from '../../components/DermatologistSection';
import { useTracking } from '../../providers/TrackingProvider';
import { useLandingPage } from './LandingPageContext';
import { getSharedStats, updateSharedStats, getCurrentLocation, rotateLocation } from '../../utils/sharedStats';

const PREPAID_PRICE = 999;
const MRP = 1699;

// Product Images
const HERO_IMAGE = 'https://customer-assets.emergentagent.com/job_ae0c9586-b94c-4054-b869-8b9baeb452c6/artifacts/gwxje1nv_1F955957-C2EB-4ED0-A713-0B302C9B4892.jpeg';
const PRODUCT_IMAGE = 'https://customer-assets.emergentagent.com/job_050b785b-bdfe-40d2-9088-b4c5bddc18c5/artifacts/f3fkk4tr_IMG_9115.png';

// Transformation Images
const TRANSFORMATION_IMAGES = [
  {
    url: 'https://customer-assets.emergentagent.com/job_26148967-6968-4918-8b5d-0a2c0e5259b2/artifacts/v7ijo66v_e1038299-e6d4-495a-aeb8-d34f76107e22.jpeg',
    label: 'Priya, 34 - Delhi',
    testimonial: '"My skin looks 10 years younger!"'
  },
  {
    url: 'https://customer-assets.emergentagent.com/job_26148967-6968-4918-8b5d-0a2c0e5259b2/artifacts/hl39qfua_6d8c1ed3-65ac-4b5e-80c8-22a3f43c0981.jpeg',
    label: 'Rahul, 38 - Mumbai',
    testimonial: '"Fine lines reduced in just 4 weeks!"'
  }
];

// Transformation Showcase Component
function TransformationShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % TRANSFORMATION_IMAGES.length);
        setIsAnimating(false);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const current = TRANSFORMATION_IMAGES[currentIndex];

  return (
    <section className="px-5 py-8">
      <div className="text-center mb-4">
        <p className="text-xs font-semibold text-green-600 tracking-wider uppercase">Proven Results</p>
        <h3 className="text-xl font-bold text-gray-900">Real Transformations, Real People</h3>
        <p className="text-sm text-gray-500 mt-1">Men & Women seeing visible results</p>
      </div>
      
      <div 
        className="relative mx-auto overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
        style={{ height: '420px', maxWidth: '350px' }}
      >
        <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          <img src={current.url} alt={`Transformation - ${current.label}`} className="w-full h-full object-contain" style={{ maxHeight: '420px' }} />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <p className="text-white font-semibold text-sm">{current.label}</p>
          <p className="text-white/90 text-xs italic">{current.testimonial}</p>
        </div>
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
          {TRANSFORMATION_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIsAnimating(true); setTimeout(() => { setCurrentIndex(i); setIsAnimating(false); }, 300); }}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-6' : 'bg-white/50'}`}
            />
          ))}
        </div>
        
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-xs font-semibold text-green-600">Verified Results</span>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-500 mt-3">Results may vary. Consistent use recommended.</p>
    </section>
  );
}

function LandingHero() {
  const navigate = useNavigate();
  const { trackPageVisit, trackViewContent, trackAction } = useTracking();
  const { 
    slug, pageData, loading, error, content, 
    productName, productTagline, productDescription,
    category, problemTitle, getProductUrl 
  } = useLandingPage();
  
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 47, seconds: 33 });
  const [viewingNow, setViewingNow] = useState(() => getSharedStats().viewingNow);
  const [soldToday, setSoldToday] = useState(() => getSharedStats().soldToday);
  const [userLocation, setUserLocation] = useState(() => getCurrentLocation());
  const pageStartTime = useRef(Date.now());

  // Dynamic problem points based on category
  const problemPoints = content.problem_points || [
    'Fine lines around eyes & forehead',
    'Dull, tired-looking skin',
    'Sagging & loss of firmness',
    'Dark spots & uneven skin tone',
    'Dry, dehydrated skin'
  ];

  // Dynamic benefits based on category
  const keyBenefits = content.solution_benefits?.slice(0, 3) || [
    'Reduces Wrinkles 87%',
    'Firms Sagging Skin',
    'Visible in 14 Days'
  ];

  // Dynamic testimonials
  const testimonials = [
    { name: 'Priya', location: 'Mumbai, India', text: content.testimonials?.[0]?.text || "This serum has transformed my skin! My fine lines have reduced significantly." },
    { name: 'Varun', location: 'Bangalore, India', text: "Amazing product! My skin feels so smooth. Highly recommend for men too." },
    { name: 'Kavya', location: 'Ahmedabad, India', text: "Best serum I've used! My skin looks brighter and more youthful." },
    { name: 'Rajesh', location: 'Delhi, India', text: "After 3 weeks, my crow's feet are visibly reduced. Game changer!" },
    { name: 'Lakshmi', location: 'Chennai, India', text: "Finally found something that works! My wrinkles are lightening." },
  ];

  // FAQs - Dynamic based on category
  const faqs = [
    { id: 'faq-daily', q: 'Can I use this serum daily?', a: `Yes, ${productName} is formulated for daily use. Apply morning and evening after cleansing.` },
    { id: 'faq-sensitive', q: 'Is this suitable for sensitive skin?', a: 'Our serum is dermatologically tested and gentle. We recommend a patch test for very sensitive skin.' },
    { id: 'faq-results', q: 'How long until I see results?', a: `Most users notice improved skin texture within 2-4 weeks. ${productDescription}` },
    { id: 'faq-gender', q: 'Is this suitable for men and women?', a: `Absolutely! ${productName} works effectively for all genders, addressing common signs of aging.` },
  ];

  useEffect(() => {
    if (pageData) {
      trackPageVisit(`landing_${slug}`);
      trackViewContent(problemTitle, PREPAID_PRICE);
    }
  }, [pageData, slug, problemTitle, trackPageVisit, trackViewContent]);

  useEffect(() => {
    // Countdown timer
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

    // Sync viewers
    const viewerInterval = setInterval(() => {
      const delta = Math.floor(Math.random() * 5) - 2;
      const stats = getSharedStats();
      const newValue = Math.max(15, Math.min(50, stats.viewingNow + delta));
      updateSharedStats({ viewingNow: newValue });
      setViewingNow(newValue);
    }, 5000);

    // Rotate location
    const locationInterval = setInterval(() => {
      setUserLocation(rotateLocation());
    }, 4000);

    return () => {
      const timeOnPage = Math.round((Date.now() - pageStartTime.current) / 1000);
      trackAction('landing_time_on_page', { slug, seconds: timeOnPage });
      clearInterval(timer);
      clearInterval(viewerInterval);
      clearInterval(locationInterval);
    };
  }, [slug, trackAction]);

  const handleOrderNow = () => {
    trackAction('landing_cta_click', { slug, button: 'order_now' });
    sessionStorage.setItem('landing_page_slug', slug);
    navigate(getProductUrl());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500 mb-6">This page doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Announcement Bar */}
      <div className="announcement-bar bg-gray-900 text-white py-2 px-4 text-center text-sm">
        Clinically Proven Anti Aging Formula | Trusted by 50,000+ Across India
      </div>

      {/* Urgency Banner */}
      <div className="bg-red-500 text-white py-2 px-4 flex items-center justify-center gap-3 text-sm">
        <Flame size={16} className="animate-pulse" />
        <span className="font-semibold">FLASH SALE ENDS IN:</span>
        <div className="flex gap-1 font-mono font-bold">
          <span className="bg-white/20 px-2 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>:
          <span className="bg-white/20 px-2 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>:
          <span className="bg-white/20 px-2 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="px-5 pt-8 pb-6 text-center">
        {/* Problem Statement Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full mb-4 text-sm font-semibold border border-amber-200">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          {content.hero_problem_statement?.split('.')[0] || "TIRED OF LOOKING OLDER THAN YOU FEEL?"}
        </div>
        
        {/* Main Headline - Dynamic */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
          {problemTitle || content.hero_headline}
        </h1>
        
        {/* Sub-headline */}
        <p className="text-gray-600 mb-4 text-lg">
          India's #1 <strong>{productName}</strong> for <strong>{category === 'wrinkles' ? 'Wrinkles & Fine Lines' : category === 'under_eye' ? 'Dark Circles & Tired Eyes' : 'Anti-Aging & Skin Renewal'}</strong>
        </p>

        {/* Key Benefits */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-5 text-xs">
          {keyBenefits.map((benefit, idx) => (
            <span key={idx} className={`px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
              idx === 0 ? 'bg-green-100 text-green-700' : idx === 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Check size={14} /> {benefit}
            </span>
          ))}
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1 text-orange-600">
            <Users size={16} />
            <span><strong>{viewingNow}</strong> viewing now</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <ShieldCheck size={16} />
            <span><strong>{soldToday}</strong> sold today</span>
          </div>
        </div>
        
        {/* CTA Button */}
        <button onClick={handleOrderNow} className="btn-cg-primary">
          Start My Anti Aging Journey ₹{PREPAID_PRICE}
          <ChevronRight size={20} />
        </button>

        {/* Trust Elements */}
        <p className="text-xs text-gray-500 mt-3">
          Free Delivery • COD Available • 30 Day Money Back Guarantee
        </p>

        {/* Location Social Proof */}
        <div className="mt-5 mx-auto max-w-xs bg-gradient-to-r from-green-50 to-green-50 border border-green-200 rounded-xl p-3">
          <div className="flex items-center justify-center gap-2">
            <MapPin size={16} className="text-green-600" />
            <p className="text-sm text-gray-700">
              <span className="font-bold text-green-600">{userLocation.customerCount.toLocaleString()}+</span> customers in <span className="font-semibold">{userLocation.state}</span> trust us
            </p>
          </div>
        </div>

        {/* Gender Inclusive */}
        <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-700">
          <span>Trusted by <strong>Men & Women</strong> ages 25-55</span>
        </div>
      </section>

      {/* Product Image */}
      <section className="px-5 py-6">
        <div className="flex justify-center">
          <img src={HERO_IMAGE} alt={productName} className="w-80 h-auto max-w-full" />
        </div>
      </section>

      {/* Problem Awareness Section */}
      <section className="px-5 py-6 bg-gradient-to-b from-amber-50 to-white">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-amber-600 tracking-wider uppercase mb-2">Do You Relate?</p>
          <h2 className="text-xl font-bold text-gray-900">{content.problem_title || "Signs You Shouldn't Ignore"}</h2>
        </div>
        
        <div className="space-y-3 max-w-sm mx-auto">
          {problemPoints.map((problem, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
              <span className="text-2xl">{['👁️', '😔', '📉', '🔵', '🏜️'][idx % 5]}</span>
              <span className="text-gray-700 font-medium">{problem}</span>
              <Check className="ml-auto text-red-500 w-5 h-5" />
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200 text-center">
          <p className="text-green-800 font-semibold mb-1">Good News!</p>
          <p className="text-sm text-green-700">{productName} targets ALL these concerns with our advanced formula</p>
        </div>
      </section>

      {/* Dermatologist Section */}
      <DermatologistSection />

      {/* Trust Badges */}
      <section className="px-5 py-4">
        <div className="flex justify-around">
          {[
            { icon: ShieldCheck, label: 'Dermatologist Tested' },
            { icon: Truck, label: 'Free Delivery' },
            { icon: Clock, label: '2-3 Day Delivery' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <item.icon size={18} className="text-green-600" />
              </div>
              <span className="text-xs text-gray-600 text-center">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Transformation Showcase */}
      <TransformationShowcase />

      {/* Product Introduction */}
      <section className="px-5 py-8">
        <p className="section-label text-xs text-gray-500 mb-1 text-center uppercase tracking-wider">INTRODUCING</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">{productName}</h2>
        <p className="text-gray-600 mb-6 leading-relaxed text-center">{productDescription}</p>
        
        <div className="space-y-3 mb-6">
          {(content.solution_benefits || []).slice(0, 4).map((benefit, idx) => (
            <div key={idx} className="check-item flex items-center gap-3">
              <div className="check-icon w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check size={14} className="text-white" />
              </div>
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
        
        <button onClick={handleOrderNow} className="btn-cg-dark w-full bg-gray-900 text-white py-3 rounded-xl font-semibold">
          Shop Now
        </button>
      </section>

      {/* Testimonials */}
      <section className="py-8 overflow-hidden">
        <div className="px-5 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">What Our Customers Say</h2>
          <p className="text-gray-500 text-sm">2,340+ verified reviews</p>
        </div>
        
        <div className="testimonial-scroll-container overflow-hidden">
          <div className="testimonial-scroll-track flex">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="testimonial-card min-w-[280px] flex-shrink-0 mx-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-semibold">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <Check size={12} className="text-green-500" /> Verified • {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Serums in One */}
      <section className="px-5 py-8">
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 mb-1">India's First All in 1 Serum</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            4 Serums in <span className="text-green-500">One</span> Bottle
          </h2>
          <p className="text-gray-600 text-sm">Why buy 4 separate serums when you can get all benefits in one?</p>
          <div className="inline-block mt-2 px-3 py-1.5 bg-green-50 rounded-full">
            <span className="text-green-600 font-semibold text-sm">Save ₹1900+ Instantly</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { num: 1, label: 'Anti Aging', ingredient: 'Retinol', desc: 'Smooths texture, minimizes pores' },
            { num: 2, label: 'Brightening', ingredient: 'Niacinamide', desc: 'Reduces dark spots' },
            { num: 3, label: 'Protection', ingredient: 'Vitamin E', desc: 'Fights fine lines' },
            { num: 4, label: 'Hydration', ingredient: 'Hyaluronic Acid', desc: 'Locks in moisture' },
          ].map((item) => (
            <div key={item.num} className="ingredient-card bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="ingredient-number w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mb-2">{item.num}</div>
              <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">{item.ingredient}</h3>
              <p className="text-gray-500 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
        
        <button onClick={handleOrderNow} className="btn-cg-primary w-full mt-6 bg-green-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          Order Now ₹{PREPAID_PRICE}
          <ChevronRight size={20} />
        </button>
      </section>

      {/* FAQ */}
      <section className="px-5 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Frequently Asked Questions</h2>
        <p className="text-gray-500 text-sm mb-5">Everything you need to know about {productName}</p>
        
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div key={faq.id} className="faq-item border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="faq-header w-full p-4 flex items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-gray-900">{faq.q}</span>
                {expandedFaq === faq.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {expandedFaq === faq.id && (
                <div className="faq-content px-4 pb-4 text-xs text-gray-600">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-8 text-center">
        <p className="text-gray-600 text-sm mb-4">
          Start your journey to radiant, youthful-looking skin today with {productName}.
        </p>
        <button onClick={handleOrderNow} className="btn-cg-primary bg-green-500 text-white py-3 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 mx-auto">
          Order Now ₹{PREPAID_PRICE}
          <ChevronRight size={20} />
        </button>
      </section>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-3 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Limited Time Offer</p>
            <p className="font-bold text-gray-900">₹{PREPAID_PRICE} <span className="text-sm text-gray-400 line-through">₹{MRP}</span> <span className="text-xs text-green-600 font-medium">53% OFF</span></p>
          </div>
          <button onClick={handleOrderNow} className="btn-cg-primary py-3 px-6 bg-green-500 text-white rounded-xl font-semibold flex items-center gap-1">
            Order Now <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scroll-testimonials {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .testimonial-scroll-track {
          animation: scroll-testimonials 15s linear infinite;
        }
        .testimonial-scroll-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default LandingHero;
