import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SyncIcon } from '../icons/Icons';

export function ClaimAccountView({ onSwitchView }) {
  const { claimAccount } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
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
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await claimAccount({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      birthDate: formData.birthDate,
      password: formData.password
    });

    if (res?.ok) {
      setSuccess(true);
    } else {
      setError(res?.error || 'Could not verify your youth record. Ensure your name and email match your registration.');
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
            src="/MFCYouth.ico"
            alt="MFC Youth Logo"
            style={{ width: '48px', height: '48px', margin: '0 auto 10px', display: 'block', borderRadius: '10px' }}
          />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Claim Your Youth Account
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Activate login credentials for your pre-registered profile
          </p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✓</div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--color-success)', marginBottom: '8px' }}>
                Account Claimed!
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Your youth account has been activated with your new password. You can now sign in.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onSwitchView('login')}
              >
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-danger-bg)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger-border)',
                    fontSize: '0.85rem'
                  }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="claimFirstName">First Name *</label>
                  <input
                    id="claimFirstName"
                    name="firstName"
                    type="text"
                    required
                    className="form-input"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="claimLastName">Last Name *</label>
                  <input
                    id="claimLastName"
                    name="lastName"
                    type="text"
                    required
                    className="form-input"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="claimEmail">Email Address *</label>
                <input
                  id="claimEmail"
                  name="email"
                  type="email"
                  required
                  placeholder="The email your servant leader recorded"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="claimBirthDate">Birth Date (Optional)</label>
                <input
                  id="claimBirthDate"
                  name="birthDate"
                  type="date"
                  className="form-input"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="claimPassword">New Password *</label>
                  <input
                    id="claimPassword"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="form-input"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="claimConfirmPassword">Confirm Password *</label>
                  <input
                    id="claimConfirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    className="form-input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <SyncIcon size={16} spinning />
                    Verifying Record...
                  </>
                ) : (
                  'Claim and Activate Account'
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
