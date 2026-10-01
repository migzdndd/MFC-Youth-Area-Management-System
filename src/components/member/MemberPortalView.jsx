import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { LoadingView, EmptyView, ErrorView } from '../common/StateViews';
import {
  EventsIcon,
  CheckIcon,
  XIcon,
  EditIcon,
  LogoutIcon,
  SyncIcon
} from '../icons/Icons';

export function MemberPortalView({ previewMode = false, onExitPreview }) {
  const { user, session, logout } = useAuth();

  const [member, setMember] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab control on mobile for Gatherings split
  const [gatheringsTab, setGatheringsTab] = useState('upcoming'); // 'upcoming' | 'past'

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Edit Profile Form State
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contact: '',
    firstAttendedYouthCamp: '',
    address: '',
    avatarUrl: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwNotice, setPwNotice] = useState(null);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, eventsRes, participantsRes] = await Promise.all([
        apiRequest('/api/members'),
        apiRequest('/api/events'),
        apiRequest('/api/participants')
      ]);

      const memberList = membersRes?.ok ? (membersRes.members || []) : [];
      const eventList = eventsRes?.ok ? (eventsRes.events || []) : [];
      const partList = participantsRes?.ok ? (participantsRes.participants || []) : [];

      setEvents(eventList);
      setParticipants(partList);

      // Find current user's member record
      const currentMemberId = session?.memberId || user?.memberId;
      const currentEmail = (session?.email || user?.email || '').toLowerCase();

      let targetMember = memberList.find(m => String(m.id) === String(currentMemberId));
      if (!targetMember && currentEmail) {
        targetMember = memberList.find(m => (m.email || '').toLowerCase() === currentEmail);
      }

      if (!targetMember) {
        targetMember = {
          id: currentMemberId || 'local_user',
          firstName: session?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Member',
          lastName: session?.name?.split(' ').slice(1).join(' ') || '',
          email: session?.email || user?.email || '',
          chapterName: session?.chapterName || 'Unassigned',
          status: 'Active Member',
          services: ['Youth Member'],
          contact: '',
          accessLevel: session?.role || 'member',
          firstAttendedYouthCamp: ''
        };
      }

      setMember(targetMember);
      setEditFormData({
        firstName: targetMember.firstName || targetMember.first_name || '',
        middleName: targetMember.middleName || targetMember.middle_name || '',
        lastName: targetMember.lastName || targetMember.last_name || '',
        contact: targetMember.contact || targetMember.contact_number || '',
        firstAttendedYouthCamp: (targetMember.firstAttendedYouthCamp || targetMember.first_attended_youth_camp || '').slice(0, 10),
        address: targetMember.address || '',
        avatarUrl: targetMember.avatarUrl || targetMember.avatar_url || ''
      });
    } catch (err) {
      setError(err.message || 'Unable to load member portal data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setEditFormData(prev => ({ ...prev, avatarUrl: dataUrl }));
        // Direct save if triggered from quick badge
        saveDirectAvatar(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const saveDirectAvatar = async (dataUrl) => {
    if (!member) return;
    setMember(prev => ({ ...prev, avatarUrl: dataUrl }));
    try {
      await apiRequest('/api/members', {
        method: 'PUT',
        body: JSON.stringify({
          id: member.id,
          avatarUrl: dataUrl
        })
      });
    } catch (err) {
      console.warn('Avatar update sync:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editFormData.firstName.trim() || !editFormData.lastName.trim()) {
      setProfileMsg({ ok: false, message: 'First name and last name are required.' });
      return;
    }

    setSavingProfile(true);
    setProfileMsg(null);

    const payload = {
      id: member.id,
      firstName: editFormData.firstName.trim(),
      middleName: editFormData.middleName.trim(),
      lastName: editFormData.lastName.trim(),
      contactNumber: editFormData.contact.trim(),
      firstAttendedYouthCamp: editFormData.firstAttendedYouthCamp || null,
      address: editFormData.address.trim(),
      avatarUrl: editFormData.avatarUrl || null
    };

    try {
      const res = await apiRequest('/api/members', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res?.ok !== false) {
        setMember(prev => ({
          ...prev,
          firstName: payload.firstName,
          middleName: payload.middleName,
          lastName: payload.lastName,
          contact: payload.contactNumber,
          firstAttendedYouthCamp: payload.firstAttendedYouthCamp,
          address: payload.address,
          avatarUrl: payload.avatarUrl
        }));
        setIsEditProfileOpen(false);
      } else {
        setProfileMsg({ ok: false, message: res?.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileMsg({ ok: false, message: err.message || 'Error updating profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwNotice({ ok: false, message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwNotice({ ok: false, message: 'Password must be at least 8 characters long.' });
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
        setPwNotice({ ok: true, message: 'Password updated successfully.' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setIsChangePasswordOpen(false), 1200);
      } else {
        setPwNotice({ ok: false, message: res?.error || 'Failed to update password.' });
      }
    } catch (err) {
      setPwNotice({ ok: false, message: err.message || 'Error changing password.' });
    } finally {
      setPwSubmitting(false);
    }
  };

  const fmtDateTime = (val) => {
    if (!val) return '-';
    const d = new Date(val);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
  };

  const fmtDate = (val) => {
    if (!val) return 'None recorded';
    const d = new Date(val);
    return Number.isNaN(d.getTime())
      ? 'None recorded'
      : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <LoadingView message="Loading your Member Portal..." />;
  if (error && !member) return <ErrorView title="Member Portal" error={error} onRetry={loadPortalData} />;

  const now = Date.now();
  const myMemberId = String(member?.id || '');

  // Registrations for this member
  const myRegistrations = participants.filter(
    p => String(p.memberId || p.member_id) === myMemberId
  );

  const registeredEventIds = new Set(myRegistrations.map(p => String(p.eventId || p.event_id)));

  const upcomingEvents = events.filter(e => {
    const time = new Date(e.date || e.event_date || 0).getTime();
    return time >= now;
  }).sort((a, b) => new Date(a.date || a.event_date || 0).getTime() - new Date(b.date || b.event_date || 0).getTime());

  const recentEvents = events.filter(e => {
    const time = new Date(e.date || e.event_date || 0).getTime();
    return time < now;
  }).sort((a, b) => new Date(b.date || b.event_date || 0).getTime() - new Date(a.date || a.event_date || 0).getTime());

  const registeredUpcoming = upcomingEvents.filter(e => registeredEventIds.has(String(e.id))).length;
  const attendedRecent = myRegistrations.filter(p => p.attended || p.status === 'Attended').length;

  const memberFullName = `${member?.firstName || ''} ${member?.lastName || ''}`.trim() || 'Youth Member';
  const memberInitials = (member?.firstName?.[0] || 'M') + (member?.lastName?.[0] || 'Y');

  return (
    <div className="layout-body member-portal-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app, #f8fafc)' }}>
      {/* Top Navigation Bar */}
      <header className="top-header member-portal-topbar" aria-label="Member portal navigation header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        backgroundColor: 'var(--bg-surface, #ffffff)',
        borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="member-portal-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/img/logo-2.png" alt="MFC Youth Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
          <div>
            <strong style={{ fontSize: '0.95rem', letterSpacing: '0.04em', color: 'var(--mfc-blue, #002847)', display: 'block' }}>MFC YOUTH</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Member Portal</span>
          </div>
        </div>

        <nav className="member-portal-nav desktop-only" style={{ display: 'flex', gap: '20px' }}>
          <a href="#overview" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}>Overview</a>
          <a href="#events" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}>Gatherings</a>
          <a href="#profile" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}>My Profile</a>
        </nav>

        <div className="member-portal-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditProfileOpen(true)}
            style={{ minHeight: '44px' }}
          >
            Edit Profile
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm desktop-only"
            onClick={() => setIsChangePasswordOpen(true)}
            style={{ minHeight: '44px' }}
          >
            Change Password
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={logout}
            style={{ minHeight: '44px' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Portal Content */}
      <main className="main-content member-portal-main member-portal-content" style={{ maxWidth: '1080px', width: '100%', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
        {/* Preview Banner */}
        {previewMode && (
          <section className="member-preview-banner" role="status" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md, 8px)',
            color: '#92400e'
          }}>
            <div>
              <strong>Member Portal Preview</strong>
              <div style={{ fontSize: '0.82rem' }}>You are viewing the dashboard as seen by a regular member.</div>
            </div>
            {onExitPreview && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onExitPreview} style={{ minHeight: '44px' }}>
                Return to Admin Dashboard
              </button>
            )}
          </section>
        )}

        {/* Hero Section */}
        <section className="dashboard-hero member-hero" id="overview">
          <div className="dashboard-hero-copy">
            <div className="dashboard-kicker">
              <span className="dashboard-live-dot"></span>
              {previewMode ? 'Member Preview Mode' : 'MFC Youth Member Portal'}
            </div>
            <h1>Welcome, {member.firstName || memberFullName}!</h1>
            <div className="dashboard-identity-row">
              <span>Chapter: {member.chapterName || member.chapter_name || 'Unassigned'}</span>
              <span>Role: {(Array.isArray(member.services) ? member.services.join(', ') : member.services) || 'Youth Member'}</span>
              <span>Status: Active</span>
              <span>Cloud Synced</span>
            </div>
          </div>
          <div className="dashboard-hero-actions">
            <a className="btn btn-primary" href="#events" style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
              View Events &rarr;
            </a>
            <a className="btn btn-secondary" href="#profile" style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
              My Profile
            </a>
          </div>
        </section>

        {/* Quick Stats Cards */}
        <section className="dashboard-metrics-section member-metrics-section" aria-label="Member Activity Metrics">
          <div className="dashboard-metrics-layout">
            {/* Primary Card */}
            <a className="metric-card-primary member-metric-primary" href="#events" title="Jump to Community Gatherings" style={{ textDecoration: 'none' }}>
              <div className="metric-primary-header">
                <span className="metric-primary-label">Event Attendance</span>
                <span className="metric-badge-primary">Primary Record</span>
              </div>

              <div>
                <div className="metric-primary-number">{registeredUpcoming}</div>
              </div>

              <div className="metric-primary-footer">
                <div className="metric-pill-group">
                  <span className="metric-pill active">
                    <span style={{ width: '7px', height: '7px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
                    {registeredUpcoming} Registered
                  </span>
                  <span className="metric-pill">
                    ✓ {attendedRecent} Attended recently
                  </span>
                  <span className="metric-pill">
                    {myRegistrations.length} Total records
                  </span>
                </div>
                <span className="metric-action-hint">Browse Schedule &rarr;</span>
              </div>
            </a>

            {/* Secondary Cards Stack */}
            <div className="metric-secondary-stack">
              <div className="metric-card-secondary services" style={{ cursor: 'default' }}>
                <div className="metric-secondary-header">
                  <span className="metric-secondary-label">Assigned Chapter</span>
                  <span className="metric-badge-secondary">Community</span>
                </div>
                <div className="metric-secondary-body">
                  <span className="metric-secondary-number" style={{ fontSize: '1.25rem', lineHeight: 1.25 }}>
                    {member.chapterName || member.chapter_name || 'No Chapter Assigned'}
                  </span>
                </div>
                <div className="metric-secondary-footer">
                  <span style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600 }}>Community affiliation</span>
                </div>
              </div>

              <div className="metric-card-secondary reports" style={{ cursor: 'default' }}>
                <div className="metric-secondary-header">
                  <span className="metric-secondary-label">Official Record Status</span>
                  <span className="metric-badge-secondary">Verified</span>
                </div>
                <div className="metric-secondary-body">
                  <span className="metric-secondary-number" style={{ fontSize: '1.25rem', color: '#059669', lineHeight: 1.25 }}>
                    {member.status || 'Active Member'}
                  </span>
                </div>
                <div className="metric-secondary-footer">
                  <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600 }}>Record active & synced</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gatherings Section */}
        <section className="dashboard-events-big-card member-events-card" id="events">
          <div className="events-big-card-header">
            <div className="events-big-card-title-group">
              <h3>Gatherings</h3>
            </div>
            <div className="events-big-card-pills">
              <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                {upcomingEvents.length} Upcoming
              </span>
              <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                {registeredUpcoming} Registered
              </span>
              <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>
                {recentEvents.length} Past Gatherings
              </span>
            </div>
          </div>

          {/* Mobile Segmented Tab Control */}
          <div className="mobile-only" style={{ display: 'flex', gap: '8px', padding: '0 16px 12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={`btn btn-sm ${gatheringsTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, minHeight: '44px' }}
              onClick={() => setGatheringsTab('upcoming')}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${gatheringsTab === 'past' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, minHeight: '44px' }}
              onClick={() => setGatheringsTab('past')}
            >
              Past Gatherings ({recentEvents.length})
            </button>
          </div>

          {/* Desktop 2-Column Split & Mobile Tabbed View */}
          <div className="dashboard-events-split">
            {/* Left Column: Upcoming Activities */}
            <div className={`events-column ${gatheringsTab !== 'upcoming' ? 'mobile-hidden' : ''}`} id="upcoming">
              <div className="events-column-header">
                <span className="badge" style={{ background: '#0284c7', color: '#ffffff' }}>UPCOMING</span>
                <h4>Upcoming</h4>
                <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.76rem' }}>{upcomingEvents.length} scheduled</span>
              </div>

              {upcomingEvents.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {upcomingEvents.map(event => {
                    const reg = myRegistrations.find(p => String(p.eventId || p.event_id) === String(event.id));
                    const isRegistered = !!reg;
                    const isPaid = reg ? ((reg.paymentStatus || reg.payment_status) === 'Paid' || reg.paid) : false;

                    return (
                      <div key={event.id} className="card" style={{ padding: '14px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{event.name || event.title}</strong>
                          {isRegistered ? (
                            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                              Registered
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                              Open
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          📅 {fmtDateTime(event.date || event.event_date)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>📍 {event.venue || event.location || 'Venue TBA'}</span>
                          {isRegistered && (
                            <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No upcoming events scheduled yet.
                </div>
              )}
            </div>

            {/* Right Column: Past Gatherings */}
            <div className={`events-column ${gatheringsTab !== 'past' ? 'mobile-hidden' : ''}`} id="recent">
              <div className="events-column-header">
                <span className="badge" style={{ background: '#e2e8f0', color: '#475569' }}>RECENT</span>
                <h4>Past Gatherings</h4>
                <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.76rem' }}>{recentEvents.length} recorded</span>
              </div>

              {recentEvents.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentEvents.map(event => {
                    const reg = myRegistrations.find(p => String(p.eventId || p.event_id) === String(event.id));
                    const isAttended = reg ? (reg.attended || reg.status === 'Attended') : false;

                    return (
                      <div key={event.id} className="card" style={{ padding: '14px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{event.name || event.title}</strong>
                          {isAttended ? (
                            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                              ✓ Attended
                            </span>
                          ) : reg ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                              Registered
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                              Concluded
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          📅 {fmtDateTime(event.date || event.event_date)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          📍 {event.venue || event.location || 'Venue TBA'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No recent gatherings on record.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Profile Section */}
        <section className="member-profile-section" id="profile">
          <div className="card member-profile-card" style={{ padding: '24px' }}>
            <div className="member-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div className="profile-header-avatar-wrap" style={{ position: 'relative' }}>
                <div
                  className="profile-header-avatar"
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--mfc-blue, #002847)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    overflow: 'hidden'
                  }}
                >
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={memberFullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{memberInitials}</span>
                  )}
                </div>
                <label
                  htmlFor="memberAvatarUpload"
                  title="Upload photo"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <EditIcon size={14} />
                </label>
                <input
                  type="file"
                  id="memberAvatarUpload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleAvatarFile(e.target.files?.[0])}
                />
              </div>

              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                  {memberFullName}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {member.chapterName || member.chapter_name || 'MFC Youth'}
                </div>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  Active Member
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsEditProfileOpen(true)}
                  style={{ minHeight: '44px' }}
                >
                  <EditIcon size={14} />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Three Subheading Boxes Grid */}
            <div className="member-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Box 1: Personal Information */}
              <div className="profile-group-box" style={{ padding: '16px', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--border-subtle, #e2e8f0)' }}>
                <span className="profile-group-title" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mfc-blue)', display: 'block', marginBottom: '12px' }}>
                  Personal Information
                </span>
                <dl className="profile-field-list" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Full Name</dt>
                    <dd style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{memberFullName}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email Address</dt>
                    <dd style={{ margin: 0, fontWeight: 500, fontSize: '0.88rem' }}>{member.email || session?.email || '-'}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Contact Number</dt>
                    <dd style={{ margin: 0, fontSize: '0.88rem' }}>{member.contact || member.contact_number || 'None provided'}</dd>
                  </div>
                  {member.address && (
                    <div>
                      <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Address</dt>
                      <dd style={{ margin: 0, fontSize: '0.88rem' }}>{member.address}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Box 2: MFC Youth Affiliation */}
              <div className="profile-group-box" style={{ padding: '16px', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--border-subtle, #e2e8f0)' }}>
                <span className="profile-group-title" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mfc-blue)', display: 'block', marginBottom: '12px' }}>
                  MFC Youth Affiliation
                </span>
                <dl className="profile-field-list" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assigned Chapter</dt>
                    <dd style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{member.chapterName || member.chapter_name || 'No Chapter Assigned'}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Service / Ministry</dt>
                    <dd style={{ margin: 0, fontSize: '0.88rem' }}>{(Array.isArray(member.services) ? member.services.join(', ') : member.services) || 'Youth Member'}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>First Youth Camp</dt>
                    <dd style={{ margin: 0, fontSize: '0.88rem' }}>{fmtDate(member.firstAttendedYouthCamp || member.first_attended_youth_camp)}</dd>
                  </div>
                </dl>
              </div>

              {/* Box 3: Account & Security */}
              <div className="profile-group-box" style={{ padding: '16px', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--border-subtle, #e2e8f0)' }}>
                <span className="profile-group-title" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mfc-blue)', display: 'block', marginBottom: '12px' }}>
                  Account & Security
                </span>
                <dl className="profile-field-list" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Access Level</dt>
                    <dd style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                      {member.accessLevel === 'chapter_servant' ? 'Chapter Servant' : member.accessLevel || 'Youth Member'}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Database Record</dt>
                    <dd style={{ margin: 0 }}>
                      <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Supabase Connected</span>
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Security</dt>
                    <dd style={{ margin: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsChangePasswordOpen(true)}
                        style={{ minHeight: '44px' }}
                      >
                        Update Password
                      </button>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" onClick={() => setIsEditProfileOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="edit-profile-title" style={{ fontSize: '1.2rem' }}>Edit Profile</h2>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setIsEditProfileOpen(false)} aria-label="Close dialog">
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {profileMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: profileMsg.ok ? 'var(--color-success-bg, #dcfce7)' : 'var(--color-danger-bg, #fee2e2)', color: profileMsg.ok ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)', fontSize: '0.88rem' }}>
                    {profileMsg.message}
                  </div>
                )}

                {/* Avatar Preview & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--mfc-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                    {editFormData.avatarUrl ? (
                      <img src={editFormData.avatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{memberInitials}</span>
                    )}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '2px' }}>Profile Picture</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Customize your photo instead of default initials.</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label htmlFor="modalPhotoInput" className="btn btn-primary btn-sm" style={{ cursor: 'pointer', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
                        Upload Photo
                      </label>
                      <input
                        type="file"
                        id="modalPhotoInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleAvatarFile(e.target.files?.[0])}
                      />
                      {editFormData.avatarUrl && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditFormData(prev => ({ ...prev, avatarUrl: '' }))}
                          style={{ minHeight: '44px' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editFirst">First Name *</label>
                    <input
                      id="editFirst"
                      type="text"
                      required
                      className="form-input"
                      value={editFormData.firstName}
                      onChange={e => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editMiddle">Middle Name</label>
                    <input
                      id="editMiddle"
                      type="text"
                      className="form-input"
                      value={editFormData.middleName}
                      onChange={e => setEditFormData(prev => ({ ...prev, middleName: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editLast">Last Name *</label>
                    <input
                      id="editLast"
                      type="text"
                      required
                      className="form-input"
                      value={editFormData.lastName}
                      onChange={e => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editContact">Contact Number</label>
                    <input
                      id="editContact"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 09171234567"
                      value={editFormData.contact}
                      onChange={e => setEditFormData(prev => ({ ...prev, contact: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="editCamp">First Attended Youth Camp</label>
                  <input
                    id="editCamp"
                    type="date"
                    className="form-input"
                    value={editFormData.firstAttendedYouthCamp}
                    onChange={e => setEditFormData(prev => ({ ...prev, firstAttendedYouthCamp: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="editAddress">Address</label>
                  <input
                    id="editAddress"
                    type="text"
                    className="form-input"
                    placeholder="City / Municipality / Address"
                    value={editFormData.address}
                    onChange={e => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditProfileOpen(false)} disabled={savingProfile} style={{ minHeight: '44px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ minHeight: '44px' }}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="change-pw-title" onClick={() => setIsChangePasswordOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="change-pw-title" style={{ fontSize: '1.2rem' }}>Change Password</h2>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setIsChangePasswordOpen(false)} aria-label="Close dialog">
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pwNotice && (
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: pwNotice.ok ? 'var(--color-success-bg, #dcfce7)' : 'var(--color-danger-bg, #fee2e2)', color: pwNotice.ok ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)', fontSize: '0.88rem' }}>
                    {pwNotice.message}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="oldPw">Current Password</label>
                  <input
                    id="oldPw"
                    type="password"
                    required
                    className="form-input"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newPw">New Password (min 8 chars)</label>
                  <input
                    id="newPw"
                    type="password"
                    required
                    className="form-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPw">Confirm New Password</label>
                  <input
                    id="confirmPw"
                    type="password"
                    required
                    className="form-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangePasswordOpen(false)} disabled={pwSubmitting} style={{ minHeight: '44px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={pwSubmitting} style={{ minHeight: '44px' }}>
                  {pwSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
