import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getApiBaseUrl } from '../../services/api';
import { SunIcon, MoonIcon, SyncIcon } from '../icons/Icons';

export function LoginView({ onSwitchView }) {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentApiUrl = getApiBaseUrl();

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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--bg-app)'
      }}
    >
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-icon"
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="MFC Youth Logo"
            style={{ width: '64px', height: '64px', margin: '0 auto 12px', display: 'block', borderRadius: '50%', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)' }}>
            MFC Youth AMS
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Area Management System for Servant Leaders
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card" style={{ padding: '28px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger-border)',
                marginBottom: '18px',
                fontSize: '0.85rem'
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="loginEmail">Email Address</label>
              <input
                id="loginEmail"
                type="email"
                required
                autoComplete="email"
                placeholder="servant@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="loginPassword">Password</label>
              </div>
              <input
                id="loginPassword"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--mfc-blue)' }}
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <SyncIcon size={16} spinning />
                  Signing In...
                </>
              ) : (
                'Sign In to Area Portal'
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '20px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
            <div>
              New Servant Leader?{' '}
              <button
                type="button"
                className="btn btn-sm"
                style={{ color: 'var(--mfc-blue)', background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer' }}
                onClick={() => onSwitchView('register')}
              >
                Register Here
              </button>
            </div>

            <div>
              Have a pre-registered profile?{' '}
              <button
                type="button"
                className="btn btn-sm"
                style={{ color: 'var(--mfc-blue)', background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer' }}
                onClick={() => onSwitchView('claim')}
              >
                Claim Youth Account
              </button>
            </div>
          </div>
        </div>

        {/* Server Endpoint Indicator */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Server: {currentApiUrl ? currentApiUrl : 'Relative /api (Production Web)'}
        </div>
      </div>
    </div>
  );
}
