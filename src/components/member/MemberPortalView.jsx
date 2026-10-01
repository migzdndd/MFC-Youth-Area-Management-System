import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { LoadingState, ErrorState, EmptyState } from '../common/StateViews';
import { EventsIcon, GigIcon, CheckIcon, SunIcon, MoonIcon, LogoutIcon } from '../icons/Icons';
import { useTheme } from '../../context/ThemeContext';

export function MemberPortalView() {
  const { user, session, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [gigRecords, setGigRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwNotice, setPwNotice] = useState(null);

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, eventsRes, partRes, gigRes] = await Promise.all([
        apiRequest('/api/members'),
        apiRequest('/api/events'),
        apiRequest('/api/participants'),
        apiRequest('/api/gig')
      ]);

      if (membersRes?.ok && Array.isArray(membersRes.members)) {
        const found = membersRes.members.find(
          m => String(m.id) === String(session?.memberId) || m.email === session?.email
        );
        if (found) setProfile(found);
      }
      if (eventsRes?.ok && Array.isArray(eventsRes.events)) {
        setEvents(eventsRes.events);
      }
      if (partRes?.ok && Array.isArray(partRes.participants)) {
        setParticipants(partRes.participants);
      }
      if (gigRes?.ok && Array.isArray(gigRes.gig)) {
        setGigRecords(gigRes.gig);
      }
    } catch (err) {
      console.warn('[MemberPortal] Error loading member data:', err);
      setError(err.message || 'Unable to load member profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwNotice({ ok: false, message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwNotice({ ok: false, message: 'Password must be at least 8 characters.' });
      return;
    }
    setPwSubmitting(true);
    setPwNotice(null);
    try {
      const res = await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: oldPassword, newPassword })
      });
      if (res?.ok) {
        setPwNotice({ ok: true, message: 'Password changed successfully.' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwNotice({ ok: false, message: res?.error || 'Failed to change password.' });
      }
    } catch (err) {
      setPwNotice({ ok: false, message: err.message || 'Error updating password.' });
    } finally {
      setPwSubmitting(false);
    }
  };

  const eventMap = new Map(events.map(ev => [ev.id, ev]));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <LoadingState message="Loading your Member Portal..." />
      </div>
    );
  }

  const memberName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.name
    : user?.name || session?.name || 'MFC Youth Member';

  const totalGig = gigRecords.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', paddingBottom: '40px' }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="MFC Youth" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              MFC Youth Member Portal
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Welcome back, {memberName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={logout}
          >
            <LogoutIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '960px', margin: '24px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && <ErrorState message={error} onRetry={loadMemberData} />}

        {/* Member Profile Overview Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Personal Profile & Pastoral Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full Name</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{memberName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{session?.email || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contact Number</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{profile?.contact_number || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Birth Date</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{profile?.birth_date || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pastoral Group / Household</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{profile?.household_leader || profile?.pastoral_group || 'Active Household'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>School / Campus</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{profile?.school || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Event Participation & Attendance History */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            My Event Registrations & Attendance
          </h2>
          {participants.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              You have not registered for any youth events yet.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Payment Mode</th>
                    <th>Payment Status</th>
                    <th>Attendance Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => {
                    const ev = eventMap.get(p.event_id);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{ev?.title || `Event #${p.event_id}`}</td>
                        <td>{p.mode_of_payment || 'Direct'}</td>
                        <td>
                          <span className={`badge ${p.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                            {p.payment_status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          {p.attended ? (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckIcon size={14} /> Attended
                            </span>
                          ) : (
                            <span className="badge badge-secondary">Registered</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GIG Stewardship History */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              My GIG Stewardship & Tithes
            </h2>
            <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1.1rem' }}>
              Total: ₱{totalGig.toFixed(2)}
            </span>
          </div>

          {gigRecords.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              No tithes or GIG stewardship records logged yet.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {gigRecords.map(g => (
                    <tr key={g.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{g.contribution_date || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>₱{parseFloat(g.amount).toFixed(2)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{g.notes || 'Thanksgiving / Tithes'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security & Password Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Account Security & Password
          </h2>
          <form onSubmit={handleChangePassword}>
            {pwNotice && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: pwNotice.ok ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: pwNotice.ok ? 'var(--color-success)' : 'var(--color-danger)',
                  border: `1px solid ${pwNotice.ok ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                  marginBottom: '16px',
                  fontSize: '0.85rem'
                }}
              >
                {pwNotice.message}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="memOldPassword">Current Password</label>
              <input
                id="memOldPassword"
                type="password"
                required
                className="form-input"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="memNewPassword">New Password</label>
                <input
                  id="memNewPassword"
                  type="password"
                  required
                  className="form-input"
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="memConfirmPassword">Confirm New Password</label>
                <input
                  id="memConfirmPassword"
                  type="password"
                  required
                  className="form-input"
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '8px', minHeight: '44px' }}
              disabled={pwSubmitting}
            >
              {pwSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
