import API_URL from "../api";
function isBusinessOpen(openingTime, closingTime) {
  if (!openingTime || !closingTime) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMinute] = openingTime.split(":").map(Number);
  const [closeHour, closeMinute] = closingTime.split(":").map(Number);

  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes &&
      currentMinutes < closeMinutes;
  }

  // Supports businesses open overnight
  return currentMinutes >= openMinutes ||
    currentMinutes < closeMinutes;
}

function BusinessCard({ business }) {
  const openStatus = isBusinessOpen(
    business.openingTime,
    business.closingTime
  );

  return (
    <div className="business-card">

      {/* 1. Image first */}
      {business.image && (
        <img
          src={`${API_URL}${business.image}`}
          alt={business.name}
          className="business-image"
        />
      )}

      {/* 2. Name, type, description and rating in one row */}
      <div className="business-info-row">

        <h3 className="business-name">
          {business.name}
        </h3>

        <span className="category-tag">
          {business.category || "Other"}
        </span>

        <p className="business-description">
          {business.description || "No description available"}
        </p>

        <span className="business-rating">
          ⭐ {business.rating ?? 0}/5
        </span>

      </div>

      {/* 3. Opening and closing times in one row */}
      <div className="business-hours-row">
        <span>
          <strong>Opens:</strong>{" "}
          {business.openingTime || "Not provided"}
        </span>

        <span>
          <strong>Closes:</strong>{" "}
          {business.closingTime || "Not provided"}
        </span>
      </div>

      {/* 4. Additional business details */}
      <div className="business-details">
        <p>
          <strong>Location:</strong>{" "}
          {business.location || business.address || "Not provided"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {business.phone || "Not provided"}
        </p>
      </div>

      {/* 5. Current open/closed status */}
      {openStatus !== null && (
        <p className={openStatus ? "open-status" : "closed-status"}>
          {openStatus ? "🟢 Open Now" : "🔴 Closed"}
        </p>
      )}

    </div>
  );
}

export default BusinessCard;
