import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/logo-full-light.svg" alt="LocalHub Tokyo" height="40" style={{ marginBottom: 16 }} className="footer-logo-img" />
            <p>
              Your definitive guide to Tokyo. Discover the best iconic spots, hidden kissaten, and real events in the world's most vibrant city.
            </p>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">All Spots</Link></li>
              <li><Link to="/?category=Food%20and%20Izakaya">Food & Izakaya</Link></li>
              <li><Link to="/?category=Shrines%20and%20Temples">Shrines & Temples</Link></li>
              <li><Link to="/?category=Nightlife%20and%20Bars">Nightlife & Bars</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>For Businesses</h4>
            <ul>
              <li><Link to="/admin/login">Partner Login</Link></li>
              <li><a href="#">Claim Your Listing</a></li>
              <li><a href="#">Advertising</a></li>
              <li><a href="#">Guidelines</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} LocalHub Tokyo. All rights reserved.</p>
          <p>Made in Tokyo.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
