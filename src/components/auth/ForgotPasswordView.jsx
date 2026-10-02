import React, { useState } from 'react';
import { apiRequest } from '../../services/api';
import { SyncIcon, CheckIcon } from '../icons/Icons';

export function ForgotPasswordView({ onSwitchView }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered servant email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      if (res?.ok || res?.status === 200) {
        setSubmitted(true);
      } else {
        // Even if server returns failure or user not found, show helpful guidance
        setSubmitted(true);
      }
    } catch {
      // Offline / fallback grace
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--bg-main, #f8fafc)'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '36px 28px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/img/logo-2.png" alt="MFC Youth" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <div>
            <strong style={{ fontSize: '1.05rem', color: 'var(--mfc-blue, #002847)', display: 'block' }}>MFC YOUTH</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>Area Management System</span>
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main, #0f172a)' }}>
            Reset Password
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.5 }}>
            Enter your registered email address and we will provide instructions to restore access to your servant account.
          </p>
        </div>

        {submitted ? (
          <div
            style={{
              padding: '20px',
              borderRadius: '10px',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckIcon size={22} />
            </div>
            <strong style={{ fontSize: '0.98rem', color: 'var(--text-main, #0f172a)' }}>Request Received</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              If your email is registered in the Area directory, a password reset link has been dispatched. You may also contact your Chapter Servant or Area Coordinator to issue an administrative password reset.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '44px', marginTop: '8px' }}
              onClick={() => onSwitchView?.('login')}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-danger-bg, #fee2e2)',
                  color: 'var(--color-danger, #dc2626)',
                  border: '1px solid var(--color-danger-border, #fecaca)',
                  fontSize: '0.85rem'
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="resetEmail">Email Address</label>
              <input
                id="resetEmail"
                type="email"
                required
                autoComplete="email"
                placeholder="servant@mfcyouth.org"
                className="form-input"
                style={{ minHeight: '44px' }}
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minHeight: '44px', width: '100%', fontSize: '0.92rem' }}
              >
                {loading ? (
                  <>
                    <SyncIcon size={16} spinning />
                    Sending Request...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => onSwitchView?.('login')}
                style={{ minHeight: '44px', width: '100%', fontSize: '0.9rem' }}
              >
                Cancel and Return to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordView;
