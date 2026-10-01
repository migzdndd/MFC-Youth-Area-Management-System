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

  const [activeTab, setActiveTab] = useState('member'); // 'member' | 'admin'

  // Member Claim State
  const [memberClaimEmail, setMemberClaimEmail] = useState('');
  const [memberClaimPassword, setMemberClaimPassword] = useState('');
  const [memberClaimConfirm, setMemberClaimConfirm] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState('');

  // Admin Registration State
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
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState(false);

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
      // Default
    }
  };

  const handleMemberClaimSubmit = async (e) => {
    e.preventDefault();
    if (!memberClaimEmail.trim() || !memberClaimPassword) {
      setClaimError('Email and password are required.');
      return;
    }
    if (memberClaimPassword !== memberClaimConfirm) {
      setClaimError('Passwords do not match.');
      return;
    }
    if (memberClaimPassword.length < 8) {
      setClaimError('Password must be at least 8 characters long.');
      return;
    }

    setClaiming(true);
    setClaimError('');
    try {
      const res = await apiRequest('/api/auth/member-claim', {
        method: 'POST',
        body: JSON.stringify({
          email: memberClaimEmail.trim(),
          password: memberClaimPassword
        })
      });

      if (res?.ok) {
        setClaimSuccess(true);
      } else {
        setClaimError(res?.error || 'Unable to claim account. Check if your email is recorded in the directory.');
      }
    } catch (err) {
      setClaimError(err.message || 'Error claiming account.');
    } finally {
      setClaiming(false);
    }
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setAdminError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setAdminError('Password must be at least 8 characters long.');
      return;
    }
    if (!formData.adminCode.trim()) {
      setAdminError('Servant Leader registration passcode is required.');
      return;
    }

    setAdminLoading(true);
    setAdminError('');
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
      setAdminSuccess(true);
    } else {
      setAdminError(res?.error || 'Registration failed. Check your servant passcode and credentials.');
    }
    setAdminLoading(false);
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
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="/img/logo-2.png"
            alt="MFC Youth Logo"
            style={{ width: '56px', height: '56px', margin: '0 auto 10px', display: 'block', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            {activeTab === 'member' ? 'First-Time Member Access' : 'Register Admin Account'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            {activeTab === 'member'
              ? 'Set a password for your existing Member database record.'
              : 'For Chapter, Area, and Ministry leadership accounts.'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'member' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minHeight: '44px' }}
            onClick={() => setActiveTab('member')}
          >
            Member Access
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minHeight: '44px' }}
            onClick={() => setActiveTab('admin')}
          >
            Leader Registration
          </button>
        </div>

        {/* Tab 1: Member Claim */}
        {activeTab === 'member' && (
          <div className="card" style={{ padding: '28px' }}>
            {claimSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--color-success)' }}>✓</div>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--color-success)', marginBottom: '8px' }}>
                  Account Claimed Successfully!
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Your password has been set. You can now sign in to your Member Portal.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onSwitchView('login')}
                  style={{ minHeight: '44px', width: '100%' }}
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleMemberClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {claimError && (
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
                    {claimError}
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="claimEmail">Member Email Address</label>
                  <input
                    id="claimEmail"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="form-input"
                    style={{ minHeight: '44px' }}
                    value={memberClaimEmail}
                    onChange={(e) => setMemberClaimEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="claimPw">Create Password</label>
                    <input
                      id="claimPw"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Password"
                      className="form-input"
                      style={{ minHeight: '44px' }}
                      value={memberClaimPassword}
                      onChange={(e) => setMemberClaimPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="claimConfirm">Confirm Password</label>
                    <input
                      id="claimConfirm"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Confirm"
                      className="form-input"
                      style={{ minHeight: '44px' }}
                      value={memberClaimConfirm}
                      onChange={(e) => setMemberClaimConfirm(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '44px', marginTop: '8px' }}
                  disabled={claiming}
                >
                  {claiming ? 'Verifying...' : 'Create Account'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem' }}>
                  Already registered?{' '}
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
        )}

        {/* Tab 2: Admin Registration */}
        {activeTab === 'admin' && (
          <div className="card" style={{ padding: '28px' }}>
            {adminSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--color-success)' }}>✓</div>
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
                  style={{ minHeight: '44px', width: '100%' }}
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {adminError && (
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
                    {adminError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="regFirstName">First Name *</label>
                    <input
                      id="regFirstName"
                      name="firstName"
                      type="text"
                      required
                      className="form-input"
                      style={{ minHeight: '44px' }}
                      value={formData.firstName}
                      onChange={handleAdminChange}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="regLastName">Last Name *</label>
                    <input
                      id="regLastName"
                      name="lastName"
                      type="text"
                      required
                      className="form-input"
                      style={{ minHeight: '44px' }}
                      value={formData.lastName}
                      onChange={handleAdminChange}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="regEmail">Email Address *</label>
                  <input
                    id="regEmail"
                    name="email"
                    type="email"
                    required
                    className="form-input"
                    style={{ minHeight: '44px' }}
                    value={formData.email}
                    onChange={handleAdminChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="regArea">Area Location</label>
                    <select
                      id="regArea"
                      name="areaId"
                      className="form-select"
                      style={{ minHeight: '44px' }}
                      value={formData.areaId}
                      onChange={handleAdminChange}
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

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="regRole">Leadership Role</label>
                    <select
                      id="regRole"
                      name="accessRole"
                      className="form-select"
                      style={{ minHeight: '44px' }}
                      value={formData.accessRole}
                      onChange={handleAdminChange}
                    >
                      {LEADER_ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="regPassword">Password *</label>
                    <input
                      id="regPassword"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      className="form-input"
                      style={{ minHeight: '44px' }}
                      value={formData.password}
                      onChange={handleAdminChange}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="regConfirmPassword">Confirm Password *</label>
                    <input
                      id="regConfirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      className="form-input"
                      style={{ minHeight: '44px' }}
                      value={formData.confirmPassword}
                      onChange={handleAdminChange}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="adminCode">Servant Registration Passcode *</label>
                  <input
                    id="adminCode"
                    name="adminCode"
                    type="password"
                    required
                    placeholder="Private verification code"
                    className="form-input"
                    style={{ minHeight: '44px' }}
                    value={formData.adminCode}
                    onChange={handleAdminChange}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '44px', marginTop: '8px' }}
                  disabled={adminLoading}
                >
                  {adminLoading ? (
                    <>
                      <SyncIcon size={16} spinning />
                      Creating Profile...
                    </>
                  ) : (
                    'Register Admin Account'
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem' }}>
                  Already registered?{' '}
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
        )}
      </div>
    </div>
  );
}
