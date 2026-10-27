import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { XIcon } from '../icons/Icons';

export function MfaVerifyModal() {
  const { mfaState, setMfaState, verifyMfa } = useAuth();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  if (!mfaState) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError('');
    const res = await verifyMfa(code);
    if (!res.ok) {
      setError(res.error || 'Verification code failed.');
    }
    setVerifying(false);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mfa-modal-title">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 id="mfa-modal-title" style={{ fontSize: '1.15rem' }}>
            Two-Factor Verification
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={() => setMfaState(null)}
            aria-label="Cancel verification"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Enter the 6-digit security code from your authenticator app to complete sign-in for <strong>{mfaState.email}</strong>.
            </p>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  border: '1px solid var(--color-danger-border)',
                  marginBottom: '16px',
                  fontSize: '0.85rem'
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="totpCode">6-Digit Code</label>
              <input
                id="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                className="form-input"
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', fontWeight: 700 }}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMfaState(null)}
              disabled={verifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={verifying || code.length < 6}
            >
              {verifying ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
