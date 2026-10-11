import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Store, Utensils, HeartPulse, GraduationCap, ShoppingBag, Wrench, Scissors, Ticket, Map as MapIcon, List as ListIcon, Calendar } from "lucide-react";
import api from "../api";
import BusinessCard from "../components/BusinessCard";
import TokyoMap from "../components/TokyoMap";
import { useTheme } from "../context/ThemeContext";

const CATEGORY_ICONS = {
  Food: <Utensils size={16} />,
  Healthcare: <HeartPulse size={16} />,
  Education: <GraduationCap size={16} />,
  Shopping: <ShoppingBag size={16} />,
  Services: <Wrench size={16} />,
  Fitness: <HeartPulse size={16} />,
  Entertainment: <Ticket size={16} />,
  Beauty: <Scissors size={16} />,
};

function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [viewMode, setViewMode] = useState("split"); // 'list', 'map', 'split'
  const [hoveredBusinessId, setHoveredBusinessId] = useState(null);
  const { theme } = useTheme();

  const searchTerm = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "All";
  const openNow = searchParams.get("openNow") === "true";
  const sortBy = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 12;

  const updateParams = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, ...newParams, page: newParams.page || "1" });
  };

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/businesses/categories");
      return data.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["businessStats"],
    queryFn: async () => {
      const { data } = await api.get("/businesses/stats");
      return data.data;
    },
  });

  const { data: businessesData, isLoading, isError } = useQuery({
    queryKey: ["businesses", { search: searchTerm, category: selectedCategory, openNow, sort: sortBy, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit, sort: sortBy });
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (openNow) params.append("openNow", "true");

      const { data } = await api.get(`/businesses?${params.toString()}`);
      return data;
    },
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await api.get("/events?limit=10");
      return data.data;
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  const categories = ["All", ...(categoriesData || [])];
  const businesses = businessesData?.data || [];
  const pagination = businessesData?.pagination;

  return (
    <>
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="hero-background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: 0.15 }}>
          {/* Stylized Mt Fuji and Torii */}
          <svg viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', position: 'absolute', bottom: 0 }}>
            <path d="M 0,600 L 1440,600 L 1440,400 Q 1100,200 720,200 Q 340,200 0,400 Z" fill="var(--color-accent)" />
            <path d="M 520,300 L 920,300 L 870,200 L 570,200 Z" fill="var(--color-surface)" />
            {/* Sun/Moon */}
            <circle cx="720" cy="150" r="80" fill="var(--color-primary)" opacity="0.8" />
            {/* Torii Gate Silhouette */}
            <rect x="1100" y="350" width="20" height="250" fill="var(--color-bg)" />
            <rect x="1250" y="350" width="20" height="250" fill="var(--color-bg)" />
            <rect x="1080" y="380" width="210" height="20" fill="var(--color-bg)" />
            <rect x="1060" y="340" width="250" height="25" fill="var(--color-bg)" rx="10" />
          </svg>
        </div>
        <div className="container hero-content" style={{ position: 'relative', zIndex: 1 }}>
          <span className="hero-eyebrow">Tokyo's Neighborhood Compass</span>
          <h1>Discover the best local spots and real events in Tokyo</h1>
          <p className="hero-subtitle">
            From hidden kissaten to iconic shrines, experience the true pulse of the world's most vibrant city.
          </p>

          <form onSubmit={handleSearch} className="hero-search">
            <Search className="hero-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search for restaurants, services, or locations..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">
              Search
            </button>
          </form>

          <div className="category-chips">
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => updateParams({ category: cat })}
              >
                {cat !== "All" && CATEGORY_ICONS[cat]}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS SECTION */}
      <section className="events-section" style={{ padding: '80px 0', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Calendar color="var(--color-primary)" /> Happening in Tokyo
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>Discover upcoming festivals, markets, and exhibitions.</p>
            </div>
            <Link to="/events" className="btn-secondary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', textDecoration: 'none' }}>View Calendar</Link>
          </div>
          
          <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {eventsLoading ? (
              <>
                <div className="event-card skeleton" style={{ height: 380, borderRadius: 16 }}></div>
                <div className="event-card skeleton" style={{ height: 380, borderRadius: 16 }}></div>
                <div className="event-card skeleton" style={{ height: 380, borderRadius: 16 }}></div>
              </>
            ) : eventsData?.length > 0 ? (
              (eventsData || []).filter(e => new Date(e.endDate) >= new Date() || e.isDatesTBA).slice(0,3).map(event => {
                const fbImg = "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=600&auto=format&fit=crop";
                const sd = new Date(event.startDate);
                const ed = new Date(event.endDate);
                const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
                const dateStr = event.isDatesTBA 
                  ? `Expected ${sd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                  : `${sd.toLocaleDateString('en-US', dateOptions)}${ed > sd ? ` - ${ed.toLocaleDateString('en-US', dateOptions)}` : ''}`;

                return (
                <Link to={`/events/${event.slug || event._id}`} key={event._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="event-card" style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)', transition: 'var(--transition-base)', cursor: 'pointer' }}>
                    <div style={{ height: 200, background: 'var(--color-surface-alt)', position: 'relative' }}>
                      <img 
                        src={event.images?.[0]?.url || fbImg} 
                        alt={event.title.en} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.target.onerror = null; e.target.src = fbImg; }}
                      />
                      <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--color-primary)', color: '#fff', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {event.category}
                      </div>
                    </div>
                    <div style={{ padding: 24 }}>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} /> 
                        {dateStr}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: 4, lineHeight: 1.3 }}>{event.title.en}</h3>
                      {event.title.ja && (
                        <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 500 }}>
                          {event.title.ja}
                        </div>
                      )}
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>
                        {event.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13 }}>
                        <MapPin size={14} /> {event.ward} • {event.venueName || "Multiple Venues"}
                      </div>
                    </div>
                  </div>
                </Link>
              )})
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>No upcoming events found.</div>
            )}
          </div>
        </div>
      </section>

      <section className="browse-section">
        <div className="container">
          <div className="browse-header">
            <h2>
              Explore {selectedCategory !== "All" ? selectedCategory : "Tokyo Spots"}
              {pagination && (
                <span className="result-count">({pagination.total} results)</span>
              )}
            </h2>

            <div className="browse-controls">
              <div className="view-mode-toggle" style={{ display: 'flex', background: 'var(--color-surface)', padding: 4, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <button 
                  style={{ padding: '6px 12px', borderRadius: 4, background: viewMode === 'list' ? 'var(--color-surface-alt)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setViewMode('list')}
                ><ListIcon size={16}/> List</button>
                <button 
                  style={{ padding: '6px 12px', borderRadius: 4, background: viewMode === 'split' ? 'var(--color-surface-alt)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setViewMode('split')}
                ><MapIcon size={16}/> Split</button>
                <button 
                  style={{ padding: '6px 12px', borderRadius: 4, background: viewMode === 'map' ? 'var(--color-surface-alt)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setViewMode('map')}
                ><MapPin size={16}/> Map</button>
              </div>

              <button
                className={`open-now-toggle ${openNow ? "active" : ""}`}
                onClick={() => updateParams({ openNow: !openNow })}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                Open Now
              </button>

              <select
                className="browse-sort"
                value={sortBy}
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="browse-content" style={{ display: 'flex', gap: 32 }}>
            {/* LIST VIEW */}
            <div className="browse-list-container" style={{ flex: viewMode === 'split' ? '1' : viewMode === 'list' ? '1' : '0', display: viewMode === 'map' ? 'none' : 'block' }}>
              {isLoading ? (
                <div className="business-grid" style={{ gridTemplateColumns: viewMode === 'split' ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="business-card skeleton" style={{ height: 320 }}></div>
                  ))}
                </div>
              ) : isError ? (
                <div className="empty-state">
                  <Store size={48} />
                  <h3>Oops! Something went wrong</h3>
                </div>
              ) : businesses.length > 0 ? (
                <>
                  <div className="business-grid" style={{ gridTemplateColumns: viewMode === 'split' ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {businesses.map((business) => (
                      <div key={business._id} onMouseEnter={() => setHoveredBusinessId(business._id)} onMouseLeave={() => setHoveredBusinessId(null)}>
                        <BusinessCard business={business} />
                      </div>
                    ))}
                  </div>

                  {pagination && pagination.pages > 1 && (
                    <div className="pagination">
                      <button disabled={page === 1} onClick={() => updateParams({ page: page - 1 })}>Prev</button>
                      {[...Array(pagination.pages)].map((_, i) => (
                        <button key={i + 1} className={page === i + 1 ? "active" : ""} onClick={() => updateParams({ page: i + 1 })}>
                          {i + 1}
                        </button>
                      ))}
                      <button disabled={page === pagination.pages} onClick={() => updateParams({ page: page + 1 })}>Next</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Store size={48} />
                  <h3>No businesses found</h3>
                  <button className="btn-secondary" onClick={() => updateParams({ search: "", category: "All", openNow: false })}>Clear all filters</button>
                </div>
              )}
            </div>

            {/* MAP VIEW */}
            {(viewMode === 'split' || viewMode === 'map') && (
              <div className="browse-map-container" style={{ flex: '1', height: '800px', position: 'sticky', top: '24px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', zIndex: 1, minHeight: '800px' }}>
                <TokyoMap businesses={businesses} hoveredId={hoveredBusinessId} fitBoundsOnLoad={true} />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;