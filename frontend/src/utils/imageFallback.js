// Curated authentic Tokyo images for categories & spots
const CATEGORY_FALLBACK_IMAGES = {
  "Food and Izakaya": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
  "Ramen and Street Food": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1000&auto=format&fit=crop",
  "Cafes and Kissaten": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1000&auto=format&fit=crop",
  "Shrines and Temples": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
  "Parks and Gardens": "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1000&auto=format&fit=crop",
  "Museums and Galleries": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1000&auto=format&fit=crop",
  "Shopping and Markets": "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1000&auto=format&fit=crop",
  "Nightlife and Bars": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000&auto=format&fit=crop",
  "Arcades and Entertainment": "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1000&auto=format&fit=crop",
  "Sento and Onsen": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop",
  "Books and Records": "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop",
  "Landmarks and Views": "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=1000&auto=format&fit=crop",
  "Everyday Essentials": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop"
};

const DEFAULT_TOKYO_IMAGE = "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop";

export function getSpotImageUrl(business, apiUrl = "") {
  if (business?.images && business.images.length > 0) {
    const cover = business.images.find(img => img.isCover) || business.images[0];
    if (cover && cover.url && !cover.url.includes("placeholder") && cover.source !== "placeholder") {
      return cover.url.startsWith("http") ? cover.url : `${apiUrl}${cover.url}`;
    }
  }

  // Fallback to authentic category photo
  return CATEGORY_FALLBACK_IMAGES[business?.category] || DEFAULT_TOKYO_IMAGE;
}
