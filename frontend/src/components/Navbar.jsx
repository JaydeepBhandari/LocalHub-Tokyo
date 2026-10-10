import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LogOut, User as UserIcon } from "lucide-react";

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src={theme === 'light' ? '/logo-full-light.svg' : '/logo-full-dark.svg'} 
          alt="LocalHub Tokyo" 
          height="40" 
          style={{ width: 'auto', display: 'block' }} 
        />
      </Link>

      <div className="nav-links">
        <Link
          to="/"
          className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
        >
          Explore
        </Link>
        
        {isAdmin && (
          <Link
            to="/admin"
            className={`nav-link ${
              location.pathname.startsWith("/admin") ? "active" : ""
            }`}
          >
            Dashboard
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {user ? (
          <button
            onClick={handleLogout}
            className="nav-link"
            title="Log out"
          >
            <LogOut size={18} />
            <span className="sr-only">Log out</span>
          </button>
        ) : (
          <Link to="/admin/login" className="nav-link" title="Admin Login">
            <UserIcon size={18} />
            <span className="sr-only">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;