import { Utensils, HeartPulse, GraduationCap, ShoppingBag, Wrench, Scissors, Ticket, Store } from "lucide-react";

const CATEGORY_STYLES = {
  Food: { bg: "#FFF0EB", color: "#E85D2A", icon: Utensils },
  Healthcare: { bg: "#E8F5EE", color: "#2D7A4F", icon: HeartPulse },
  Education: { bg: "#EFF6FF", color: "#2563EB", icon: GraduationCap },
  Shopping: { bg: "#FDF4FF", color: "#C026D3", icon: ShoppingBag },
  Services: { bg: "#F3F4F6", color: "#4B5563", icon: Wrench },
  Fitness: { bg: "#FEF2F2", color: "#DC2626", icon: HeartPulse },
  Beauty: { bg: "#FFFBEB", color: "#D97706", icon: Scissors },
  Entertainment: { bg: "#F5F3FF", color: "#7C3AED", icon: Ticket },
};

export default function CategoryPattern({ category, size = 64 }) {
  const style = CATEGORY_STYLES[category] || { bg: "#F3F2EF", color: "#8A8A8A", icon: Store };
  const Icon = style.icon;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: style.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: -20,
        opacity: 0.05,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
        gap: '20px',
        transform: 'rotate(-15deg) scale(1.5)'
      }}>
        {Array.from({ length: 25 }).map((_, i) => (
          <Icon key={i} size={size * 0.6} color={style.color} />
        ))}
      </div>
      
      {/* Center Icon */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '16px',
        borderRadius: '50%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={size} color={style.color} />
      </div>
    </div>
  );
}
