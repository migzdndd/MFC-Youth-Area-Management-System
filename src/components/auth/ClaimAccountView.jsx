import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SyncIcon } from '../icons/Icons';

export function ClaimAccountView({ onSwitchView }) {
  const { claimAccount } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    pin: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = formData.email.trim();
    const cleanPin = formData.pin.trim();

    if (!cleanEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!cleanPin || cleanPin.length !== 4) {
      setError('Please provide your 4-digit security PIN issued by your Chapter Head.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await claimAccount({
      email: cleanEmail,
      pin: cleanPin,
      claimPin: cleanPin,
      claim_pin: cleanPin,
      password: formData.password
    });

    if (res?.ok) {
      setSuccess(true);
    } else {
      setError(res?.error || 'Could not verify your youth record. Ensure your email and 4-digit PIN match your registration.');
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
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="MFC Youth Logo"
            style={{ width: '56px', height: '56px', margin: '0 auto 10px', display: 'block', borderRadius: '50%', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Claim Your Youth Profile
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Activate your profile using your Chapter Head-assigned 4-digit PIN
          </p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#16a34a' }}>✓</div>
              <h2 style={{ fontSize: '1.2rem', color: '#16a34a', marginBottom: '8px' }}>
                Profile Claimed!
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Your account has been activated with your new password. You can now access your Digital Member Pass.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '44px' }}
                onClick={() => onSwitchView('login')}
              >
                Continue to Portal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '0.85rem'
                  }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="claimEmail">Email Address <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  id="claimEmail"
                  name="email"
                  type="email"
                  required
                  placeholder="The email recorded by your Servant Leader"
                  className="form-input"
                  style={{ minHeight: '44px' }}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="claimPin">4-Digit Security PIN <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  id="claimPin"
                  name="pin"
                  type="text"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  inputMode="numeric"
                  placeholder="••••"
                  className="form-input"
                  style={{ minHeight: '44px', textAlign: 'center', letterSpacing: '4px', fontSize: '1.1rem' }}
                  value={formData.pin}
                  onChange={handleChange}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Enter the 4-digit PIN given to you by your Chapter Head.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="claimPassword">New Password <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    id="claimPassword"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min 8 chars"
                    className="form-input"
                    style={{ minHeight: '44px' }}
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="claimConfirmPassword">Confirm Password <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    id="claimConfirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Repeat password"
                    className="form-input"
                    style={{ minHeight: '44px' }}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', minHeight: '44px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <SyncIcon size={16} spinning />
                    Verifying PIN...
                  </>
                ) : (
                  'Claim & Activate Account'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem' }}>
                Return to{' '}
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ color: 'var(--mfc-blue)', background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => onSwitchView('login')}
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
