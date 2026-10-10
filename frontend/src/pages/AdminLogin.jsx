import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ marginBottom: 24 }}>
          <Link to="/" className="detail-back" style={{ marginBottom: 0 }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <h1>Welcome Back</h1>
        <p className="login-subtitle">Sign in to manage LocalHub listings</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`form-input ${error ? "error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@localhub.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-input ${error ? "error" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          
          <div style={{ marginTop: 16, fontSize: '0.8125rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>Demo Admin: admin@localhub.com / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
