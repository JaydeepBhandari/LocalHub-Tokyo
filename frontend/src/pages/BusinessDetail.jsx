import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, MapPin, Phone, Globe, Clock, Star, 
  CheckCircle, Map 
} from "lucide-react";
import toast from "react-hot-toast";
import api, { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";
import CategoryPattern from "../components/CategoryPattern";

function isBusinessOpen(hours) {
  if (!hours || typeof hours !== 'object' || Object.keys(hours).length === 0) return null;

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayHours = hours[today];
  if (!todayHours || todayHours.length === 0) return false;

  for (const interval of todayHours) {
    if (!interval.open || !interval.close) continue;
    const [openHour, openMinute] = interval.open.split(":").map(Number);
    const [closeHour, closeMinute] = interval.close.split(":").map(Number);
    
    const openMinutes = openHour * 60 + openMinute;
    let closeMinutes = closeHour * 60 + closeMinute;
    
    if (closeMinutes < openMinutes) {
      if (currentMinutes >= openMinutes || currentMinutes <= closeMinutes) return true;
    } else {
      if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) return true;
    }
  }

  return false;
}

function BusinessDetail() {
  const { idOrSlug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: businessData, isLoading, isError } = useQuery({
    queryKey: ["business", idOrSlug],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${idOrSlug}`);
      return data.data;
    },
  });

  const business = businessData;
  const openStatus = business ? isBusinessOpen(business.hours) : null;
  const coverImage = business?.images && business.images.length > 0 
    ? business.images.find(img => img.isCover) || business.images[0]
    : null;

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", business?._id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews?business=${business._id}&limit=50`);
      return data.data;
    },
    enabled: !!business?._id,
  });

  const submitReview = useMutation({
    mutationFn: async (reviewData) => {
      const { data } = await api.post("/reviews", reviewData);
      return data;
    },
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setComment("");
      setRating(5);
      queryClient.invalidateQueries(["reviews", business._id]);
      queryClient.invalidateQueries(["business", idOrSlug]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to submit review");
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId) => {
      const { data } = await api.delete(`/reviews/${reviewId}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries(["reviews", business._id]);
      queryClient.invalidateQueries(["business", idOrSlug]);
    },
    onError: (error) => toast.error("Failed to delete review"),
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to leave a review");
      return;
    }
    submitReview.mutate({ business: business._id, rating, comment });
  };

  if (isLoading) {
    return (
      <div className="container detail-page">
        <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-xl)', marginBottom: 32 }}></div>
        <div className="detail-grid">
          <div className="skeleton" style={{ height: 400 }}></div>
          <div className="skeleton" style={{ height: 300 }}></div>
        </div>
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="container detail-page" style={{ textAlign: 'center', padding: '64px 0' }}>
        <h2>Business not found</h2>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', marginTop: 16, width: 'auto' }}>
          Back to Directory
        </Link>
      </div>
    );
  }

  const renderCover = () => {
    if (!coverImage || coverImage.source === 'placeholder') {
      return (
        <div className="detail-hero-image" style={{ overflow: 'hidden', padding: 0 }}>
          <CategoryPattern category={business.category} size={120} />
        </div>
      );
    }
    const imgUrl = coverImage.url.startsWith('http') ? coverImage.url : `${API_URL}${coverImage.url}`;
    return (
      <div className="detail-hero-image-wrap" style={{ position: 'relative' }}>
        <img src={imgUrl} alt={business.name} className="detail-hero-image" onError={(e) => {
          e.target.style.display = 'none';
          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
        }} />
        <div className="fallback-pattern" style={{ display: 'none', width: '100%', height: 400, justifyContent: 'center', alignItems: 'center', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <CategoryPattern category={business.category} size={120} />
        </div>
      </div>
    );
  };

  return (
    <div className="container detail-page">
      <Link to="/" className="detail-back">
        <ArrowLeft size={16} /> Back to directory
      </Link>

      {renderCover()}

      <div className="detail-grid">
        <div className="detail-main">
          <h1>{business.name}</h1>
          
          <div className="detail-meta">
            <span className="card-category">{business.category}</span>
            <div className="detail-rating">
              <Star fill="currentColor" size={18} />
              {business.avgRating > 0 ? business.avgRating.toFixed(1) : "New"} 
              <span className="card-review-count">
                ({business.reviewCount} {business.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            {business.priceLevel && (
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {"$".repeat(business.priceLevel)}
              </span>
            )}
            {business.isVerified && (
              <span className="detail-verified">
                <CheckCircle size={14} /> Verified
              </span>
            )}
          </div>

          <p className="detail-description">{business.description}</p>

          {business.tags && business.tags.length > 0 && (
            <div className="detail-tags">
              {business.tags.map(tag => (
                <span key={tag} className="detail-tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="reviews-section">
            <h2>Reviews</h2>
            
            {user ? (
              <form onSubmit={handleReviewSubmit} className="admin-form" style={{ maxWidth: '100%', marginBottom: 32 }}>
                <h3 style={{ marginTop: 0, fontSize: '1.125rem' }}>Write a Review</h3>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                  <label>Rating:</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <option value="5">5 Stars - Excellent</option>
                    <option value="4">4 Stars - Very Good</option>
                    <option value="3">3 Stars - Average</option>
                    <option value="2">2 Stars - Poor</option>
                    <option value="1">1 Star - Terrible</option>
                  </select>
                </div>
                <textarea
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="3"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '12px' }}
                ></textarea>
                <button type="submit" className="btn-primary" disabled={submitReview.isPending} style={{ width: 'auto' }}>
                  {submitReview.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div style={{ padding: 24, background: 'var(--color-surface-alt)', borderRadius: 8, marginBottom: 32, textAlign: 'center' }}>
                <p>Log in to leave a review for {business.name}.</p>
                <Link to="/admin/login" className="btn-secondary" style={{ display: 'inline-flex', marginTop: 12, width: 'auto' }}>
                  Log In
                </Link>
              </div>
            )}

            <div className="reviews-list">
              {reviewsData && reviewsData.length > 0 ? (
                reviewsData.map(review => (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="review-author">
                        <div className="review-avatar">{review.userName.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="review-author-name">{review.userName}</div>
                          <div className="review-date">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <div className="review-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} color={i < review.rating ? "var(--color-star)" : "var(--color-border)"} />
                          ))}
                        </div>
                        {(user?.role === "admin" || user?._id === review.user) && (
                          <button onClick={() => deleteReview.mutate(review._id)} style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {review.comment && <p className="review-comment">{review.comment}</p>}
                  </div>
                ))
              ) : (
                <div style={{ padding: 32, textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                  <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="detail-info-card">
            <h3 style={{ marginBottom: 16 }}>Business Info</h3>
            
            <div className="detail-info-row">
              <MapPin size={18} />
              <div>
                <div>{business.location}</div>
                {(business.area || business.city) && (
                  <div style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {business.area}{business.area && business.city ? ', ' : ''}{business.city}
                  </div>
                )}
                {business.station && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                    <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', textAlign: 'center', lineHeight: '16px', fontSize: 10, fontWeight: 'bold' }}>M</span>
                    {business.station} {business.line && <span style={{ color: 'var(--color-text-muted)' }}>({business.line})</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="detail-info-row">
              <Clock size={18} />
              <div>
                {openStatus !== null ? (
                  <div className={`hours-status ${openStatus ? "open" : "closed"}`}>
                    {openStatus ? "Open Now" : "Closed"}
                  </div>
                ) : (
                   <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Hours Not Listed</div>
                )}
                {business.hoursText && business.hoursText !== "Hours not listed" && (
                   <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                     {business.hoursText}
                   </div>
                )}
              </div>
            </div>

            {business.phone && (
              <div className="detail-info-row">
                <Phone size={18} />
                <a href={`tel:${business.phone}`}>{business.phone}</a>
              </div>
            )}

            {business.website && (
              <div className="detail-info-row">
                <Globe size={18} />
                <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer">
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            
            {business.paymentOptions && business.paymentOptions.length > 0 && (
              <div className="detail-info-row" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>💴</span>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Payment</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {business.paymentOptions.map(p => (
                      <span key={p} style={{ background: 'var(--color-surface-alt)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="detail-action-buttons">
            <a 
              href={`https://maps.google.com/?q=${business.geo?.coordinates[1]},${business.geo?.coordinates[0]}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="detail-action-btn primary"
            >
              <Map size={18} /> Directions
            </a>
            {business.phone && (
              <a href={`tel:${business.phone}`} className="detail-action-btn secondary">
                <Phone size={18} /> Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessDetail;
