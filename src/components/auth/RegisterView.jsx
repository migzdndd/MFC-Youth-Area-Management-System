import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { SyncIcon } from '../icons/Icons';

const LEADER_ROLES = [
  { value: 'chapter_servant', label: 'Chapter Servant' },
  { value: 'area_servant', label: 'Area Servant' },
  { value: 'lit_servant', label: 'Area LIT Servant' },
  { value: 'campus_servant', label: 'Campus Servant' },
  { value: 'area_kids_servant', label: 'Area Kids Servant' },
  { value: 'mfc_high_servant', label: 'MFC High Servant' },
  { value: 'couple_coordinator', label: 'Couple Coordinator' },
  { value: 'national_coordinator', label: 'National Coordinator' }
];

export function RegisterView({ onSwitchView }) {
  const { registerAdmin } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    areaId: '',
    accessRole: 'chapter_servant',
    adminCode: ''
  });

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const res = await apiRequest('/api/areas');
      if (res?.ok && Array.isArray(res.areas)) {
        setAreas(res.areas);
        if (res.areas.length > 0) {
          setFormData(prev => ({ ...prev, areaId: res.areas[0].id }));
        }
      }
    } catch {
      // If areas fail to load, allow manual entry or default
    }
  };

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
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!formData.adminCode.trim()) {
      setError('Servant Leader registration passcode is required.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await registerAdmin({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      areaId: formData.areaId,
      accessRole: formData.accessRole,
      adminCode: formData.adminCode.trim()
    });

    if (res?.ok) {
      setSuccess(true);
    } else {
      setError(res?.error || 'Registration failed. Check your servant passcode and credentials.');
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
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="/MFCYouth.ico"
            alt="MFC Youth Logo"
            style={{ width: '48px', height: '48px', margin: '0 auto 10px', display: 'block', borderRadius: '10px' }}
          />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Servant Leader Registration
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Register your area leadership access account
          </p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✓</div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--color-success)', marginBottom: '8px' }}>
                Account Created Successfully!
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Your Servant Leader profile has been created. You can now sign in to access your Area portal.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onSwitchView('login')}
              >
                Go to Sign In
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
                  <label className="form-label" htmlFor="regFirstName">First Name *</label>
                  <input
                    id="regFirstName"
                    name="firstName"
                    type="text"
                    required
                    className="form-input"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="regLastName">Last Name *</label>
                  <input
                    id="regLastName"
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
                <label className="form-label" htmlFor="regEmail">Email Address *</label>
                <input
                  id="regEmail"
                  name="email"
                  type="email"
                  required
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="regArea">Area Location</label>
                  <select
                    id="regArea"
                    name="areaId"
                    className="form-select"
                    value={formData.areaId}
                    onChange={handleChange}
                  >
                    {areas.length > 0 ? (
                      areas.map(a => (
                        <option key={a.id} value={a.id}>{a.name || a.area_name}</option>
                      ))
                    ) : (
                      <option value="">Default Area</option>
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="regRole">Leadership Role</label>
                  <select
                    id="regRole"
                    name="accessRole"
                    className="form-select"
                    value={formData.accessRole}
                    onChange={handleChange}
                  >
                    {LEADER_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="regPassword">Password *</label>
                  <input
                    id="regPassword"
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
                  <label className="form-label" htmlFor="regConfirmPassword">Confirm Password *</label>
                  <input
                    id="regConfirmPassword"
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="adminCode">Servant Registration Passcode *</label>
                <input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  required
                  placeholder="Private verification code"
                  className="form-input"
                  value={formData.adminCode}
                  onChange={handleChange}
                />
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
                    Creating Profile...
                  </>
                ) : (
                  'Complete Leader Registration'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem' }}>
                Already registered?{' '}
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ color: 'var(--mfc-blue)', background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => onSwitchView('login')}
                >
                  Sign In Here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
