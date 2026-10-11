import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, MapPin, ExternalLink, CalendarPlus, ChevronRight, 
  Ticket, ArrowLeft, Clock, Share2, Tag, Compass, Sparkles, Check
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";

function generateGoogleCalendarUrl(event) {
  const title = encodeURIComponent(event.title.en + (event.title.ja ? ` (${event.title.ja})` : ""));
  const details = encodeURIComponent(
    `${event.description || ""}\n\nVenue: ${event.venueName || ""}, ${event.ward || "Tokyo"}\nOfficial: ${event.officialUrl || ""}`
  );
  const location = encodeURIComponent(`${event.venueName || ""}, ${event.ward || ""}, Tokyo, Japan`);
  
  const sd = new Date(event.startDate);
  const ed = new Date(event.endDate);
  
  const formatGCalDate = (d) => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };
  
  const dates = `${formatGCalDate(sd)}/${formatGCalDate(ed)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

function downloadIcsFile(event) {
  const sd = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const ed = new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const title = event.title.en + (event.title.ja ? ` (${event.title.ja})` : "");
  const desc = (event.description || "").replace(/\n/g, "\\n");
  const loc = `${event.venueName || ""}, ${event.ward || ""}, Tokyo, Japan`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LocalHub Tokyo//Tokyo Events//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${loc}`,
    `DTSTART:${sd}`,
    `DTEND:${ed}`,
    `STATUS:CONFIRMED`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${(event.slug || "event")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Calendar file (.ics) downloaded!");
}

function EventDetail() {
  const { idOrSlug } = useParams();
  const [copied, setCopied] = useState(false);

  const { data: eventData, isLoading, isError } = useQuery({
    queryKey: ["event", idOrSlug],
    queryFn: async () => {
      const { data } = await api.get(`/events/${idOrSlug}`);
      return data.data;
    },
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: eventData?.title?.en || "Tokyo Event",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="skeleton" style={{ height: 350, borderRadius: 16, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    );
  }

  if (isError || !eventData) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Event not found</h2>
        <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>This event may have finished or the link is incorrect.</p>
        <Link to="/events" className="btn-primary" style={{ display: "inline-flex", marginTop: 20, width: "auto" }}>
          <ArrowLeft size={16} /> Back to Events Calendar
        </Link>
      </div>
    );
  }

  const event = eventData;
  const isTBA = event.isDatesTBA;
  const sd = new Date(event.startDate);
  const ed = new Date(event.endDate);
  
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = isTBA 
    ? `Expected ${sd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Dates TBA`
    : `${sd.toLocaleDateString('en-US', dateOptions)}${ed > sd ? ` – ${ed.toLocaleDateString('en-US', dateOptions)}` : ''}`;

  const timeStr = isTBA ? "Schedule TBA" : `${sd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${ed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  const fbImg = "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=1200&auto=format&fit=crop";
  const coverImg = event.images?.[0]?.url || fbImg;

  const isOngoingOrUpcoming = ed >= new Date();

  return (
    <div className="event-detail-page" style={{ paddingBottom: 80 }}>
      {/* Hero Banner */}
      <div style={{ height: "45vh", minHeight: 360, position: "relative", background: "var(--color-surface-alt)", overflow: "hidden" }}>
        <img 
          src={coverImg} 
          alt={event.title.en} 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          onError={(e) => { e.target.onerror = null; e.target.src = fbImg; }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(to top, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.3) 60%, transparent 100%)" }} />
        
        {/* Navigation back bar */}
        <div className="container" style={{ position: "absolute", top: 24, left: 0, right: 0, zIndex: 10 }}>
          <Link to="/events" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "8px 16px", borderRadius: "var(--radius-pill)", textDecoration: "none", fontSize: 14 }}>
            <ArrowLeft size={16} /> All Tokyo Events
          </Link>
        </div>

        {/* Floating banner metadata */}
        <div className="container" style={{ position: "absolute", bottom: 28, left: 0, right: 0, zIndex: 10, color: "#fff" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <span style={{ background: "var(--color-primary)", color: "#fff", padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {event.category}
            </span>
            <span style={{ background: isOngoingOrUpcoming ? "rgba(34, 197, 94, 0.9)" : "rgba(100, 116, 139, 0.9)", color: "#fff", padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: 12, fontWeight: 600 }}>
              {isOngoingOrUpcoming ? "Upcoming / Active" : "Concluded"}
            </span>
          </div>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 800, color: "#fff", lineHeight: 1.15, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {event.title.en}
          </h1>
          {event.title.ja && (
            <div style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.85)", marginTop: 6, fontWeight: 500, letterSpacing: "1px" }}>
              {event.title.ja}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Details */}
      <div className="container" style={{ marginTop: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>
          
          {/* Left Column: Details & Description */}
          <div style={{ background: "var(--color-surface)", padding: 36, borderRadius: 20, border: "1px solid var(--color-border)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            
            {/* Quick Metrics Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, paddingBottom: 28, borderBottom: "1px solid var(--color-border)", marginBottom: 32 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ padding: 10, borderRadius: 10, background: "var(--color-surface-alt)", color: "var(--color-primary)" }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>Date</div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>{dateStr}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ padding: 10, borderRadius: 10, background: "var(--color-surface-alt)", color: "var(--color-primary)" }}>
                  <Clock size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>Schedule</div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>{timeStr}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ padding: 10, borderRadius: 10, background: "var(--color-surface-alt)", color: "var(--color-primary)" }}>
                  <Ticket size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>Admission</div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>{event.ticketInfo || "Free Admission"}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ padding: 10, borderRadius: 10, background: "var(--color-surface-alt)", color: "var(--color-primary)" }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>Venue</div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>{event.venueName || "Tokyo Venue"}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{event.ward} Ward, Tokyo</div>
                </div>
              </div>
            </div>

            {/* About Event */}
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} color="var(--color-primary)" /> About This Event
              </h2>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "var(--color-text)", fontSize: "1.05rem" }}>
                {event.description}
              </p>
            </div>

            {/* Tokyo Visitor Tips & Etiquette */}
            <div style={{ background: "var(--color-surface-alt)", borderRadius: 16, padding: 24, border: "1px solid var(--color-border)", marginBottom: 36 }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Compass size={18} color="var(--color-primary)" /> Tokyo Festival & Visitor Tips
              </h3>
              <ul style={{ paddingLeft: 20, margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.7, fontSize: 14 }}>
                <li><strong>Cash Preparation:</strong> Many traditional food stalls (yatai) and temple charms only accept Japanese Yen cash.</li>
                <li><strong>Getting There:</strong> Tokyo trains and subways can be crowded during peak festival hours; consider arriving 30–45 minutes early.</li>
                <li><strong>Trash Disposal:</strong> Public trash cans are rare in Tokyo; bring a small plastic bag to carry your personal garbage until you return to your hotel or station.</li>
                <li><strong>Photography:</strong> Photography is generally welcomed at public festivals, but avoid photographing private shrine rituals or people without consideration.</li>
              </ul>
            </div>

            {/* Official Link */}
            {event.officialUrl && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Official Event Organizer</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Visit the official page for live announcements and schedules</div>
                </div>
                <a 
                  href={event.officialUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary" 
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  Official Site <ExternalLink size={15} />
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Action Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 24 }}>
            {/* Action Card */}
            <div style={{ background: "var(--color-surface)", padding: 28, borderRadius: 20, border: "1px solid var(--color-border)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 16 }}>Save & Attend</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a 
                  href={generateGoogleCalendarUrl(event)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary" 
                  style={{ textDecoration: "none", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12 }}
                >
                  <CalendarPlus size={18} /> Add to Google Calendar
                </a>

                <button 
                  onClick={() => downloadIcsFile(event)} 
                  className="btn-secondary" 
                  style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12 }}
                >
                  <Calendar size={18} /> Download iCal (.ics)
                </button>

                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName || ""} ${event.ward || ""} Tokyo`)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary" 
                  style={{ textDecoration: "none", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12 }}
                >
                  <MapPin size={18} /> Google Maps Directions
                </a>

                <button 
                  onClick={handleShare} 
                  className="btn-secondary" 
                  style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12 }}
                >
                  {copied ? <Check size={18} color="#22c55e" /> : <Share2 size={18} />} 
                  {copied ? "Link Copied!" : "Share Event"}
                </button>
              </div>
            </div>

            {/* Venue & Location Card */}
            <div style={{ background: "var(--color-surface)", padding: 24, borderRadius: 20, border: "1px solid var(--color-border)" }}>
              <h4 style={{ fontSize: "1rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={16} color="var(--color-primary)" /> Venue Information
              </h4>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{event.venueName || "Multiple Locations"}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 4 }}>
                {event.ward ? `${event.ward} Ward, ` : ""}Tokyo, Japan
              </div>
              {event.businessId && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Hosted at local spot:</div>
                  <Link to={`/business/${event.businessId.slug || event.businessId._id}`} style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    {event.businessId.name} <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetail;

