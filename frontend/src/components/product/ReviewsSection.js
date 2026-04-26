import React, { memo } from 'react';
import { Star, ThumbsUp, CheckCircle, Quote, ChevronDown, ChevronUp } from 'lucide-react';

// Reviews data with unique IDs
const REVIEWS = [
  { 
    id: 'review-priya',
    name: 'Priya M.', 
    location: 'Mumbai',
    verified: true,
    rating: 5,
    text: 'My skin looks 10 years younger! The fine lines around my eyes have almost disappeared. Best investment ever!',
    date: '2 days ago',
    helpful: 234
  },
  { 
    id: 'review-anita',
    name: 'Anita S.', 
    location: 'Delhi',
    verified: true,
    rating: 5,
    text: 'Finally found something that actually works! My pigmentation has reduced significantly in just 3 weeks.',
    date: '5 days ago',
    helpful: 189
  },
  { 
    id: 'review-deepa',
    name: 'Deepa K.', 
    location: 'Bangalore',
    verified: true,
    rating: 5,
    text: 'Love how lightweight it is. No greasy feeling at all. My skin glows naturally now!',
    date: '1 week ago',
    helpful: 156
  },
];

// Star rating display
const ReviewStars = memo(({ rating = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: rating }, (_, i) => (
      <Star key={`review-star-${i}`} size={12} className="star-gold" />
    ))}
  </div>
));
ReviewStars.displayName = 'ReviewStars';

// Single review card
const ReviewCard = memo(({ review }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-white font-bold text-sm">
          {review.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm text-gray-900">{review.name}</span>
            {review.verified && (
              <CheckCircle size={12} className="text-green-500" />
            )}
          </div>
          <span className="text-xs text-gray-500">{review.location}</span>
        </div>
      </div>
      <ReviewStars rating={review.rating} />
    </div>
    
    <div className="relative mb-2">
      <Quote size={14} className="absolute -top-1 -left-1 text-green-200" />
      <p className="text-sm text-gray-600 pl-4">{review.text}</p>
    </div>
    
    <div className="flex items-center justify-between text-xs text-gray-400">
      <span>{review.date}</span>
      <div className="flex items-center gap-1">
        <ThumbsUp size={12} />
        <span>{review.helpful} found helpful</span>
      </div>
    </div>
  </div>
));
ReviewCard.displayName = 'ReviewCard';

// Reviews section with show more/less
function ReviewsSection({ showAll = false, onToggle }) {
  const displayedReviews = showAll ? REVIEWS : REVIEWS.slice(0, 2);
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Customer Reviews</h3>
        <span className="text-xs text-gray-500">4.8 out of 5</span>
      </div>
      
      <div className="space-y-3">
        {displayedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      
      {REVIEWS.length > 2 && (
        <button 
          onClick={onToggle}
          className="w-full mt-3 py-2 text-sm text-green-600 font-medium flex items-center justify-center gap-1"
        >
          {showAll ? (
            <>Show Less <ChevronUp size={16} /></>
          ) : (
            <>Show More Reviews <ChevronDown size={16} /></>
          )}
        </button>
      )}
    </div>
  );
}

export default memo(ReviewsSection);
export { ReviewCard, ReviewStars, REVIEWS };
