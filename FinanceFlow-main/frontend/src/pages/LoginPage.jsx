import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_USERS = [
  { email: 'admin@financeflow.com', password: 'admin123', role: 'Admin', desc: 'Full access — users, records, dashboard' },
  { email: 'analyst@financeflow.com', password: 'analyst123', role: 'Analyst', desc: 'View records & dashboard insights' },
  { email: 'viewer@financeflow.com', password: 'viewer123', role: 'Viewer', desc: 'Dashboard view only' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(u) {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💹</div>
          <span className="auth-logo-text">FinanceFlow</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button id="login-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '⌛ Signing in...' : '→ Sign In'}
          </button>
        </form>

        <div className="auth-demo" style={{ marginTop: 28 }}>
          <div className="auth-demo-title">🔑 Demo Accounts — click to fill</div>
          {DEMO_USERS.map(u => (
            <button
              key={u.email}
              className="auth-demo-btn"
              type="button"
              onClick={() => fillDemo(u)}
            >
              <strong>{u.role} — {u.email}</strong>
              {u.desc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
