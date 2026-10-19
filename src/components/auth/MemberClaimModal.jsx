import React, { useState } from 'react';
import { XIcon, CheckIcon, SyncIcon } from '../icons/Icons';
import { useAuth } from '../../context/AuthContext';

export function MemberClaimModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const { claimAccount } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    pin: '',
    password: '',
    confirmPassword: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [claimed, setClaimed] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = formData.email.trim();
    const cleanPin = formData.pin.trim();

    if (!cleanEmail) {
      setError('Email address is required.');
      return;
    }

    if (!cleanPin || cleanPin.length !== 4) {
      setError('Please provide your 4-digit security PIN issued by your Chapter Head.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await claimAccount({
        email: cleanEmail,
        pin: cleanPin,
        password: formData.password
      });

      if (res?.ok) {
        setClaimed(true);
        if (typeof onSuccess === 'function') {
          setTimeout(() => {
            onSuccess(res);
          }, 1200);
        }
      } else {
        setError(res?.error || 'Claim verification failed. Please check your email and 4-digit PIN.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to claim service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="claim-profile-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px', width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="claim-profile-title" style={{ fontSize: '1.2rem', marginBottom: '2px' }}>
              Claim Your Youth Profile
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Self-service onboarding with 4-digit Chapter PIN
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        {claimed ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckIcon size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              Profile Claimed Successfully!
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your account has been activated. Redirecting you to your Digital Pass...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Member Email <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '0.9rem' }}
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  4-Digit Security PIN <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="pin"
                  maxLength={4}
                  pattern="\d{4}"
                  inputMode="numeric"
                  className="form-control"
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '1.1rem', letterSpacing: '4px', textAlign: 'center' }}
                  placeholder="••••"
                  value={formData.pin}
                  onChange={handleChange}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Assigned by your Chapter Head / Servant Leader.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  New Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  minLength={8}
                  className="form-control"
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '0.9rem' }}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  minLength={8}
                  className="form-control"
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '0.9rem' }}
                  placeholder="Repeat new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting} style={{ minHeight: '44px' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {submitting ? (
                  <>
                    <SyncIcon size={16} spinning />
                    Claiming...
                  </>
                ) : (
                  'Claim and Activate Profile'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
export default MemberClaimModal;
