import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../services/api';
import { SunIcon, MoonIcon } from '../icons/Icons';

export function LoginView({ onSwitchView }) {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Daily Readings & Changelogs for Left Hero
  const [readingsSummary, setReadingsSummary] = useState("Loading today's readings...");
  const [changelogs, setChangelogs] = useState([]);

  useEffect(() => {
    // Load daily readings
    apiRequest('/api/daily-readings')
      .then(res => {
        if (res?.ok && res.readings) {
          const title = res.readings.title || res.readings.date || 'Daily Mass Readings';
          const gospel = res.readings.gospel ? ` · ${res.readings.gospel.reference || 'Gospel'}` : '';
          setReadingsSummary(`${title}${gospel}`);
        } else {
          setReadingsSummary('Daily Scripture and reflections available inside.');
        }
      })
      .catch(() => setReadingsSummary('Daily Scripture and reflections available inside.'));

    // Load recent changelogs
    apiRequest('/api/changelogs')
      .then(res => {
        if (res?.ok && Array.isArray(res.changelogs)) {
          setChangelogs(res.changelogs.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await login(email.trim(), password, rememberMe);
    if (!res.ok && !res.mfaRequired) {
      setError(res.error || 'Invalid credentials or inactive servant account.');
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    await login('admin@mfcyouth.local', 'admin123', true);
    setLoading(false);
  };

  return (
    <div className="auth-body auth-body-modern" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top right theme toggle */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 100 }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-icon"
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      <main className="auth-page auth-page-modern" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div className="auth-layout auth-layout-modern" style={{ maxWidth: '1100px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', alignItems: 'center' }}>
          
          {/* Desktop Left Hero */}
          <aside className="auth-info login-hero desktop-only" aria-label="MFC Youth Area Management System overview" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="login-hero-brand" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="/img/logo.png" className="login-hero-logo" alt="MFC Youth" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              <span className="login-hero-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
                <span className="status-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></span>
                Cloud connected
              </span>
            </div>

            <div className="login-hero-copy">
              <span className="login-eyebrow" style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                AREA MANAGEMENT SYSTEM
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.25, color: '#ffffff', margin: '0 0 12px 0' }}>
                Lead your Area with one clear, secure workspace.
              </h2>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.75)', margin: 0 }}>
                Members, chapters, services, events, reports, and GIG records stay organized in a single cloud-backed dashboard built for MFC Youth leaders.
              </p>
            </div>

            <div className="login-feature-grid" aria-label="Key system features" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <article style={{ padding: '12px 14px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.9rem' }}>Members</strong>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)' }}>Profiles, access, chapters and service assignments</span>
              </article>
              <article style={{ padding: '12px 14px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.9rem' }}>Events</strong>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)' }}>Registration, payment and attendance tracking</span>
              </article>
              <article style={{ padding: '12px 14px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.9rem' }}>Reports</strong>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)' }}>Activity reports and Area-level analytics</span>
              </article>
              <article style={{ padding: '12px 14px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.9rem' }}>Secure</strong>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)' }}>Role-based access through Supabase Auth</span>
              </article>

              {/* Liturgical Daily Readings card */}
              <article style={{ gridColumn: 'span 2', padding: '12px 14px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>Daily Readings</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                  {readingsSummary}
                </div>
              </article>

              {/* Changelogs card */}
              <article style={{ gridColumn: 'span 2', padding: '12px 14px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>Changelogs</strong>
                  <button
                    type="button"
                    onClick={() => onSwitchView?.('changelogs')}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Full Tech Log &rarr;
                  </button>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {changelogs.length > 0 ? (
                    changelogs.map((c, i) => (
                      <li key={i}>{c.title || c.description || c.version}</li>
                    ))
                  ) : (
                    <li>Version release history and operational updates.</li>
                  )}
                </ul>
              </article>
            </div>

            <div className="login-hero-footer" style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              <span><strong style={{ color: '#ffffff' }}>4</strong> NCR Areas ready</span>
              <span><strong style={{ color: '#ffffff' }}>1</strong> Connected workspace</span>
              <span><strong style={{ color: '#ffffff' }}>24/7</strong> Web access</span>
            </div>
          </aside>

          {/* Right Login Card (Desktop & Mobile) */}
          <section className="login-card login-card-modern floating-login-card card" aria-labelledby="loginTitle" style={{ padding: '32px', borderRadius: '16px' }}>
            <div className="login-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="login-mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/img/logo-2.png" alt="MFC Youth Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                <div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--mfc-blue, #002847)', display: 'block' }}>MFC YOUTH</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Area Management System</span>
                </div>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                Secure leader access
              </span>
            </div>

            <div className="login-header login-header-modern" style={{ marginBottom: '20px' }}>
              <span className="login-eyebrow" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--mfc-blue)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                WELCOME BACK
              </span>
              <h1 id="loginTitle" style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                Sign in to your Area
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                Use your registered MFC Youth account to continue to the management dashboard.
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: 'var(--color-danger-bg, #fee2e2)',
                  color: 'var(--color-danger, #dc2626)',
                  border: '1px solid var(--color-danger-border, #fecaca)',
                  marginBottom: '18px',
                  fontSize: '0.85rem'
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="loginEmail">Email Address</label>
                <input
                  id="loginEmail"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="form-input"
                  style={{ minHeight: '44px' }}
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="loginPassword">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--mfc-blue)', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="form-input"
                  style={{ minHeight: '44px' }}
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    disabled={loading}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => onSwitchView?.('forgot-password')}
                  style={{ background: 'none', border: 'none', color: 'var(--mfc-blue)', fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ minHeight: '44px', width: '100%', fontSize: '0.95rem' }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onSwitchView?.('register')}
                  style={{ minHeight: '44px', width: '100%', fontSize: '0.9rem' }}
                >
                  First-Time Access / Register
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDemoLogin}
                disabled={loading}
                style={{ minHeight: '44px', width: '100%', fontSize: '0.88rem' }}
              >
                Open Demo Dashboard
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                Presentation mode only. Demo data is kept separate from live Area records.
              </p>
            </form>

            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '20px', paddingTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              <span>Not yet in the database? Contact your Chapter Servant.</span>
            </div>
          </section>
        </div>
      </main>

      {/* Global Authentication Footer */}
      <footer className="auth-footer" style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Visit the Official MFC Youth Page at <a href="https://mfcyouth.org" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>mfcyouth.org</a> &middot; <button type="button" onClick={() => onSwitchView?.('changelogs')} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 600, cursor: 'pointer', padding: 0 }}>System Changelogs</button> &middot; Powered &amp; designed by <a href="https://migzdndd.github.io/web-portfolio/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>migz.dev</a>
      </footer>
    </div>
  );
}
