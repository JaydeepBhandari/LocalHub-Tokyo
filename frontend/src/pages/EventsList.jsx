import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import api from "../api";

function EventsList() {
  const [filter, setFilter] = useState("upcoming");

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["events", filter],
    queryFn: async () => {
      // Actually we just get all events and filter on frontend for simplicity in prototype
      const { data } = await api.get("/events?limit=100");
      return data.data;
    },
  });

  const now = new Date();
  
  const filteredEvents = (eventsData || []).filter(e => {
    const end = new Date(e.endDate);
    if (filter === "upcoming") return end >= now || e.isDatesTBA;
    if (filter === "past") return end < now && !e.isDatesTBA;
    return true;
  }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return (
    <div className="container" style={{ padding: "40px 0" }}>
      <h1 style={{ marginBottom: 8 }}>Tokyo Events Calendar</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 32 }}>Find out what's happening around the city.</p>
      
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <button className={`category-chip ${filter === "upcoming" ? "active" : ""}`} onClick={() => setFilter("upcoming")}>Upcoming & Ongoing</button>
        <button className={`category-chip ${filter === "past" ? "active" : ""}`} onClick={() => setFilter("past")}>Past Events</button>
        <button className={`category-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All Events</button>
      </div>
      
      {isLoading ? (
        <div style={{ padding: "40px 0", textAlign: "center" }}>Loading...</div>
      ) : filteredEvents.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {filteredEvents.map(event => {
            const sd = new Date(event.startDate);
            const ed = new Date(event.endDate);
            const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
            const dateStr = event.isDatesTBA 
              ? `Expected ${sd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
              : `${sd.toLocaleDateString('en-US', dateOptions)}${ed > sd ? ` - ${ed.toLocaleDateString('en-US', dateOptions)}` : ''}`;
            const fbImg = "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=600&auto=format&fit=crop";
            
            return (
              <Link to={`/events/${event.slug || event._id}`} key={event._id} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div className="event-card" style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)', transition: 'var(--transition-base)' }}>
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
                      <Calendar size={14} /> {dateStr}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: 4, lineHeight: 1.3 }}>{event.title.en}</h3>
                    {event.title.ja && (
                      <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 500 }}>
                        {event.title.ja}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, marginTop: 16 }}>
                      <MapPin size={14} /> {event.ward} • {event.venueName || "Multiple Venues"}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)" }}>No events found.</div>
      )}
    </div>
  );
}

export default EventsList;
