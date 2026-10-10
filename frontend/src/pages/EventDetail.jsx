import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, ExternalLink, CalendarPlus, ChevronRight } from "lucide-react";
import api from "../api";

function EventDetail() {
  const { idOrSlug } = useParams();

  const { data: eventData, isLoading, isError } = useQuery({
    queryKey: ["event", idOrSlug],
    queryFn: async () => {
      const { data } = await api.get(`/events/${idOrSlug}`);
      return data.data;
    },
  });

  if (isLoading) return <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>Loading event...</div>;
  if (isError || !eventData) return <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>Event not found.</div>;

  const event = eventData;
  const isTBA = event.isDatesTBA;
  const sd = new Date(event.startDate);
  const ed = new Date(event.endDate);
  
  // Format dates
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = isTBA 
    ? `Expected ${sd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Dates TBA`
    : `${sd.toLocaleDateString('en-US', dateOptions)}${ed > sd ? ` - ${ed.toLocaleDateString('en-US', dateOptions)}` : ''}`;

  const fbImg = "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=1200&auto=format&fit=crop";
  const coverImg = event.images?.[0]?.url || fbImg;

  return (
    <div className="event-detail-page">
      <div style={{ height: "40vh", minHeight: 300, position: "relative", background: "var(--color-bg)" }}>
        <img 
          src={coverImg} 
          alt={event.title.en} 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          onError={(e) => { e.target.onerror = null; e.target.src = fbImg; }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}></div>
      </div>
      
      <div className="container" style={{ marginTop: "-80px", position: "relative", zIndex: 10, paddingBottom: 80 }}>
        <div style={{ background: "var(--color-surface)", padding: 40, borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "inline-block", background: "var(--color-primary)", color: "#fff", padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: 12, fontWeight: "bold", textTransform: "uppercase", marginBottom: 16 }}>
            {event.category}
          </div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: 8, lineHeight: 1.2 }}>{event.title.en}</h1>
          {event.title.ja && <h2 style={{ fontSize: "1.5rem", color: "var(--color-text-muted)", fontWeight: 500, marginBottom: 24 }}>{event.title.ja}</h2>}
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24, padding: "24px 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <Calendar color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Date & Time</div>
                <div style={{ color: "var(--color-text-secondary)" }}>{dateStr}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <MapPin color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Location</div>
                <div style={{ color: "var(--color-text-secondary)" }}>
                  {event.businessId ? (
                    <Link to={`/business/${event.businessId.slug || event.businessId._id}`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>{event.venueName} <ExternalLink size={12} /></Link>
                  ) : (
                    <>{event.venueName}</>
                  )}
                  <br />
                  <span style={{ fontSize: 14 }}>{event.ward}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Ticket color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Admission</div>
                <div style={{ color: "var(--color-text-secondary)" }}>{event.ticketInfo || "Free"}</div>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
            {event.officialUrl && (
              <a href={event.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                Official Website <ExternalLink size={16} />
              </a>
            )}
            <button className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <CalendarPlus size={16} /> Add to Calendar
            </button>
          </div>
          
          <div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: 16 }}>About This Event</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "var(--color-text-secondary)" }}>{event.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetail;
