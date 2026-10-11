import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Grid, CalendarDays, Search, Sparkles, ChevronRight, ExternalLink } from "lucide-react";
import api from "../api";

const CATEGORY_COLORS = {
  matsuri: "#e11d48", // Rose red
  seasonal: "#059669", // Emerald
  art: "#7c3aed", // Violet
  food: "#d97706", // Amber
  market: "#2563eb", // Blue
  music: "#db2777", // Pink
  "tech/culture": "#0891b2" // Cyan
};

function EventsList() {
  const [filter, setFilter] = useState("upcoming");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("grid"); // 'grid' | 'calendar'

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await api.get("/events?limit=100");
      return data.data;
    },
  });

  const now = new Date();
  
  const filteredEvents = (eventsData || []).filter(e => {
    // Time filter
    const end = new Date(e.endDate);
    if (filter === "upcoming" && !(end >= now || e.isDatesTBA)) return false;
    if (filter === "past" && (end >= now || e.isDatesTBA)) return false;
    
    // Category filter
    if (selectedCategory !== "all" && e.category !== selectedCategory) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (e.title?.en || "").toLowerCase().includes(q) || (e.title?.ja || "").includes(q);
      const matchVenue = (e.venueName || "").toLowerCase().includes(q) || (e.ward || "").toLowerCase().includes(q);
      const matchDesc = (e.description || "").toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchDesc) return false;
    }

    return true;
  }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // Group events by month for the Calendar view
  const eventsByMonth = filteredEvents.reduce((acc, event) => {
    const d = new Date(event.startDate);
    const monthKey = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(event);
    return acc;
  }, {});

  const fbImg = "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=600&auto=format&fit=crop";

  return (
    <div className="events-calendar-page" style={{ paddingBottom: 80 }}>
      {/* Hero Header */}
      <div style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "48px 0 36px 0", position: "relative", overflow: "hidden" }}>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
            <Sparkles size={16} /> Tokyo Festivals & Culture • 東京の年中行事
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 8 }}>Tokyo Events Calendar</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem", maxWidth: 650, lineHeight: 1.6 }}>
            Discover matsuri festivals, sakura cherry blossom gatherings, art exhibitions, and vibrant night markets across Tokyo's 23 wards.
          </p>

          {/* Search Bar */}
          <div style={{ marginTop: 28, maxWidth: 540, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input 
              type="text" 
              placeholder="Search by festival, temple, artist, or ward..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", fontSize: 15 }}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 32 }}>
        {/* Controls Bar: Filters & View Switcher */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid var(--color-border)" }}>
          {/* Status Chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className={`category-chip ${filter === "upcoming" ? "active" : ""}`} onClick={() => setFilter("upcoming")}>
              Upcoming & Ongoing
            </button>
            <button className={`category-chip ${filter === "past" ? "active" : ""}`} onClick={() => setFilter("past")}>
              Past Events
            </button>
            <button className={`category-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              All Events ({eventsData?.length || 0})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: "flex", background: "var(--color-surface)", padding: 4, borderRadius: 10, border: "1px solid var(--color-border)" }}>
            <button 
              onClick={() => setViewType("grid")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "none", background: viewType === "grid" ? "var(--color-surface-alt)" : "transparent", color: "var(--color-text)", fontWeight: viewType === "grid" ? 600 : 400, cursor: "pointer", fontSize: 14 }}
            >
              <Grid size={16} /> Grid View
            </button>
            <button 
              onClick={() => setViewType("calendar")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "none", background: viewType === "calendar" ? "var(--color-surface-alt)" : "transparent", color: "var(--color-text)", fontWeight: viewType === "calendar" ? 600 : 400, cursor: "pointer", fontSize: 14 }}
            >
              <CalendarDays size={16} /> Month By Month
            </button>
          </div>
        </div>

        {/* Category Chips Bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {["all", "matsuri", "seasonal", "art", "food", "market"].map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid",
                borderColor: selectedCategory === cat ? "var(--color-primary)" : "var(--color-border)",
                background: selectedCategory === cat ? "var(--color-primary)" : "var(--color-surface)",
                color: selectedCategory === cat ? "#fff" : "var(--color-text)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.15s ease"
              }}
            >
              {cat === "all" ? "All Categories" : cat === "matsuri" ? "🏮 Matsuri (Festivals)" : cat === "seasonal" ? "🌸 Seasonal (Sakura/Winter)" : cat === "art" ? "🎨 Art & Culture" : cat === "food" ? "🍜 Food Events" : "🛍️ Markets"}
            </button>
          ))}
        </div>

        {/* Content Render */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="skeleton" style={{ height: 380, borderRadius: 16 }} />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)" }}>
            <Calendar size={48} color="var(--color-text-muted)" style={{ margin: "0 auto 16px auto" }} />
            <h3>No events found matching your filter</h3>
            <p style={{ color: "var(--color-text-muted)", marginTop: 6 }}>Try clearing your search query or selecting a different category.</p>
            <button 
              className="btn-secondary" 
              onClick={() => { setFilter("upcoming"); setSelectedCategory("all"); setSearchQuery(""); }}
              style={{ marginTop: 16 }}
            >
              Reset Filters
            </button>
          </div>
        ) : viewType === "calendar" ? (
          /* Monthly Calendar Grouped View */
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {Object.entries(eventsByMonth).map(([month, events]) => (
              <div key={month} style={{ background: "var(--color-surface)", padding: 32, borderRadius: 20, border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid var(--color-border)" }}>
                  <div style={{ width: 12, height: 28, background: "var(--color-primary)", borderRadius: 4 }} />
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>{month}</h2>
                  <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>({events.length} event{events.length > 1 ? "s" : ""})</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                  {events.map(event => (
                    <EventCardItem key={event._id} event={event} fbImg={fbImg} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Standard Responsive Grid View */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {filteredEvents.map(event => (
              <EventCardItem key={event._id} event={event} fbImg={fbImg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCardItem({ event, fbImg }) {
  const sd = new Date(event.startDate);
  const ed = new Date(event.endDate);
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const dateStr = event.isDatesTBA 
    ? `Expected ${sd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : `${sd.toLocaleDateString('en-US', dateOptions)}${ed > sd ? ` – ${ed.toLocaleDateString('en-US', dateOptions)}` : ''}`;

  const categoryColor = CATEGORY_COLORS[event.category] || "var(--color-primary)";

  return (
    <Link to={`/events/${event.slug || event._id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div 
        className="event-card" 
        style={{ 
          background: 'var(--color-surface)', 
          borderRadius: 16, 
          overflow: 'hidden', 
          border: '1px solid var(--color-border)', 
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        <div style={{ height: 200, background: 'var(--color-surface-alt)', position: 'relative', overflow: 'hidden' }}>
          <img 
            src={event.images?.[0]?.url || fbImg} 
            alt={event.title.en} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
            onError={(e) => { e.target.onerror = null; e.target.src = fbImg; }}
          />
          <div style={{ position: 'absolute', top: 14, left: 14, background: categoryColor, color: '#fff', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {event.category}
          </div>
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', color: '#fff', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
            {event.ticketInfo || "Free"}
          </div>
        </div>

        <div style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'var(--color-primary)', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Calendar size={14} /> {dateStr}
          </div>
          
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>
            {event.title.en}
          </h3>
          
          {event.title.ja && (
            <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 500 }}>
              {event.title.ja}
            </div>
          )}

          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13.5, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>
            {event.description}
          </p>

          <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="var(--color-primary)" /> {event.ward} Ward
            </div>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
              Details <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default EventsList;

