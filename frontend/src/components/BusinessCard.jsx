import { Link } from "react-router-dom";
import { Star, MapPin, Phone } from "lucide-react";
import { API_URL } from "../api";
import CategoryPattern from "./CategoryPattern";
import { getSpotImageUrl } from "../utils/imageFallback";

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
    
    // Handle overnight (e.g. 18:00 - 02:00)
    if (closeMinutes < openMinutes) {
      if (currentMinutes >= openMinutes || currentMinutes <= closeMinutes) return true;
    } else {
      if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) return true;
    }
  }

  return false;
}

function BusinessCard({ business }) {
  const openStatus = isBusinessOpen(business.hours);
  const imgUrl = getSpotImageUrl(business, API_URL);

  return (
    <Link to={`/business/${business.slug || business._id}`} className="business-card">
      <div className="card-image-wrap">
        <img 
          src={imgUrl} 
          alt={business.name} 
          loading="lazy" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop";
          }} 
        />

        {openStatus !== null && (
          <div className={`card-status-badge ${openStatus ? "open" : "closed"}`}>
            {openStatus ? "Open Now" : "Closed"}
          </div>
        )}

        {business.isFeatured && (
          <div className="card-featured-badge">Featured</div>
        )}
      </div>

      <div className="card-body">
        <span className="card-category">{business.category}</span>
        
        <h3 className="card-name">{business.name}</h3>
        {business.nameJa && <div className="card-name-ja" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{business.nameJa}</div>}
        
        <div className="card-location">
          <MapPin size={14} />
          {business.area ? `${business.area}, ${business.city}` : business.location}
        </div>
      </div>

      <div className="card-footer">
        <div className="card-rating">
          {business.avgRating > 0 ? (
            <>
              <Star size={16} fill="currentColor" />
              <span>{business.avgRating.toFixed(1)}</span>
              {business.reviewCount > 0 && (
                <span className="card-review-count">({business.reviewCount})</span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              {business.priceLevel ? 'Price: ' + '$'.repeat(business.priceLevel) : (business.station ? `Near ${business.station}` : 'No reviews yet')}
            </span>
          )}
        </div>

        {business.phone ? (
          <div 
            className="card-phone" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `tel:${business.phone}`;
            }}
          >
            <Phone size={14} />
            <span>Call</span>
          </div>
        ) : (
          <div 
            className="card-phone" 
            onClick={(e) => {
              e.preventDefault();
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.geo?.coordinates?.[1]},${business.geo?.coordinates?.[0]}`, '_blank');
            }}
          >
            <MapPin size={14} />
            <span>Directions</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default BusinessCard;
