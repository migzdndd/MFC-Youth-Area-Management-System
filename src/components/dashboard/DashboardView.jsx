import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingView, ErrorView } from '../common/StateViews';

const ROLE_LABELS = {
  national_coordinator: 'National Coordinator',
  couple_coordinator: 'Couple Coordinator',
  area_servant: 'Area Servant',
  lit_servant: 'Area LIT Servant',
  campus_servant: 'Campus Servant',
  mfc_high_servant: 'MFC High Servant',
  area_kids_servant: 'Area Kids Servant',
  chapter_servant: 'Chapter Servant',
  member: 'Youth Member'
};

export function DashboardView({ onNavigate, onOpenNewMember, onOpenNewEvent, onOpenNewReport }) {
  const { user, role, areaId, areaName } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [members, setMembers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [areasCount, setAreasCount] = useState(4);

  const [mobileEventTab, setMobileEventTab] = useState('upcoming');

  const isNationalCoordinator = role === 'national_coordinator';
  const isChapterServant = role === 'chapter_servant';

  useEffect(() => {
    loadDashboardData();
  }, [areaId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, chaptersRes, eventsRes, reportsRes, areasRes] = await Promise.allSettled([
        apiRequest('/api/members'),
        apiRequest('/api/chapters'),
        apiRequest('/api/events'),
        apiRequest('/api/reports'),
        apiRequest('/api/areas')
      ]);

      const loadedMembers = membersRes.status === 'fulfilled' && membersRes.value?.ok ? (membersRes.value.members || []) : [];
      const loadedChapters = chaptersRes.status === 'fulfilled' && chaptersRes.value?.ok ? (chaptersRes.value.chapters || []) : [];
      const loadedEvents = eventsRes.status === 'fulfilled' && eventsRes.value?.ok ? (eventsRes.value.events || []) : [];
      const loadedReports = reportsRes.status === 'fulfilled' && reportsRes.value?.ok ? (reportsRes.value.reports || []) : [];

      if (areasRes.status === 'fulfilled' && areasRes.value?.ok && Array.isArray(areasRes.value.areas)) {
        setAreasCount(areasRes.value.areas.length);
      }

      setMembers(loadedMembers);
      setChapters(loadedChapters);
      setEvents(loadedEvents);
      setReports(loadedReports);
    } catch (err) {
      console.warn('[Dashboard] Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingView message="Loading Area Dashboard metrics..." />;
  }

  if (error && members.length === 0) {
    return <ErrorView title="Dashboard Error" error={error} onRetry={loadDashboardData} />;
  }

  const roleLabel = ROLE_LABELS[role] || 'Area Servant';
  const userName = user?.user_metadata?.first_name || user?.name || user?.email?.split('@')[0] || 'Leader';
  const activeAreaName = areaName || 'NCR Central';

  const visibleMembers = isChapterServant
    ? members.filter(m => m.chapter_id || m.chapterId)
    : members;

  const totalMembers = visibleMembers.length;
  const activeMembers = visibleMembers.filter(m => (m.status || 'Active') === 'Active').length;
  const inactiveMembers = totalMembers - activeMembers;

  // Services count
  let servicesCount = 5;
  if (['campus_servant'].includes(role)) servicesCount = 2;
  else if (['mfc_high_servant', 'area_kids_servant', 'chapter_servant'].includes(role)) servicesCount = 1;

  // Chapter counts distribution
  const chapterCounts = chapters
    .map(ch => ({
      id: ch.id,
      name: ch.name || ch.chapter_name || 'Chapter',
      count: visibleMembers.filter(m => String(m.chapter_id || m.chapterId) === String(ch.id)).length
    }))
    .sort((a, b) => b.count - a.count);

  const maxChapterCount = Math.max(...chapterCounts.map(c => c.count), 1);

  // Events sorting
  const now = Date.now();
  const upcomingEvents = events
    .filter(e => {
      const dt = e.event_date || e.eventDate || e.date;
      return dt && new Date(dt).getTime() >= now;
    })
    .sort((a, b) => new Date(a.event_date || a.eventDate || a.date) - new Date(b.event_date || b.eventDate || b.date))
    .slice(0, 5);

  const recentEvents = events
    .filter(e => {
      const dt = e.event_date || e.eventDate || e.date;
      return dt && new Date(dt).getTime() < now;
    })
    .sort((a, b) => new Date(b.event_date || b.eventDate || b.date) - new Date(a.event_date || a.eventDate || a.date))
    .slice(0, 5);

  const totalRegistrations = events.reduce((sum, e) => sum + (parseInt(e.registered_count || e.registered || 0, 10)), 0);
  const totalAttended = events.reduce((sum, e) => sum + (parseInt(e.attended_count || e.peopleAttended || 0, 10)), 0);

  const formatShortDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  return (
    <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Banner */}
      <section className="dashboard-hero animate-in is-visible">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">
            <span className="dashboard-live-dot"></span>
            {isNationalCoordinator ? '● National Workspace' : '● Cloud workspace'}
          </div>
          <h1>Welcome back, {userName}.</h1>
          <p>
            {isNationalCoordinator
              ? 'National overview. Select an Area below to manage records.'
              : `Overview for ${activeAreaName}. Your records are organized, synced, and ready for action.`}
          </p>
          <div className="dashboard-identity-row">
            <span>{isNationalCoordinator ? 'National Coordinator' : roleLabel}</span>
            <span>{isNationalCoordinator ? 'Super Admin Access' : activeAreaName}</span>
            <span>{isNationalCoordinator ? 'Cloud Connected' : 'Supabase connected'}</span>
          </div>
        </div>
        <div className="dashboard-hero-actions">
          {isChapterServant ? (
            <button type="button" className="btn blue" onClick={() => onNavigate('chapters')}>
              View Chapter
            </button>
          ) : (
            <button type="button" className="btn blue" onClick={() => onNavigate('members')}>
              View Members
            </button>
          )}
          <button type="button" className="btn" onClick={() => onNavigate('events')}>
            Manage Events
          </button>
        </div>
      </section>

      {/* Metrics Section: Primary (Big Card) & Secondary (Services, Reports) */}
      <section className="dashboard-metrics-section" aria-label="Dashboard Metrics">
        <div className="dashboard-metrics-layout">
          {/* Primary: Member Count Card (Big Card) */}
          <div
            className="metric-card-primary"
            onClick={() => onNavigate(isChapterServant ? 'chapters' : 'members')}
            role="button"
            tabIndex={0}
            title={isChapterServant ? 'View Chapter Roster' : 'Open Members Directory'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate(isChapterServant ? 'chapters' : 'members');
              }
            }}
          >
            <div className="metric-primary-header">
              <span className="metric-primary-label">
                {isNationalCoordinator
                  ? 'National Members'
                  : isChapterServant
                  ? 'Chapter Members'
                  : 'Total Members'}
              </span>
              <span className="metric-badge-primary">Primary</span>
            </div>

            <div>
              <div className="metric-primary-number">{totalMembers}</div>
              <p className="metric-primary-caption">
                {isNationalCoordinator
                  ? 'Total members across all areas.'
                  : isChapterServant
                  ? 'Assigned chapter members.'
                  : `Active records in ${activeAreaName}.`}
              </p>
            </div>

            <div className="metric-primary-footer">
              <div className="metric-pill-group">
                <span className="metric-pill active">
                  <span style={{ width: '7px', height: '7px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
                  {activeMembers} Active
                </span>
                {isNationalCoordinator ? (
                  <span className="metric-pill">
                    <strong>{areasCount}</strong> Active Areas &rarr;
                  </span>
                ) : (
                  inactiveMembers > 0 && <span className="metric-pill">{inactiveMembers} Inactive</span>
                )}
              </div>
              <span className="metric-action-hint">Open Directory &rarr;</span>
            </div>
          </div>

          {/* Secondary Stack: Services & Activity Reports */}
          <div className="metric-secondary-stack">
            <div
              className="metric-card-secondary services"
              onClick={() => onNavigate('services')}
              role="button"
              tabIndex={0}
              title="View Services"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onNavigate('services');
              }}
            >
              <div className="metric-secondary-header">
                <span className="metric-secondary-label">
                  {role === 'campus_servant' || role === 'mfc_high_servant' ? 'Service' : 'Services'}
                </span>
                <span className="metric-badge-secondary">Secondary</span>
              </div>
              <div className="metric-secondary-body">
                <span className="metric-secondary-number">{servicesCount}</span>
                <p className="metric-secondary-caption">Available service roles</p>
              </div>
              <div className="metric-secondary-footer">
                <span className="summary-link-hint" style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600 }}>
                  Manage services &rarr;
                </span>
              </div>
            </div>

            <div
              className="metric-card-secondary reports"
              onClick={() => onNavigate('reports')}
              role="button"
              tabIndex={0}
              title="View Activity Reports"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onNavigate('reports');
              }}
            >
              <div className="metric-secondary-header">
                <span className="metric-secondary-label">Activity Reports</span>
                <span className="metric-badge-secondary">Secondary</span>
              </div>
              <div className="metric-secondary-body">
                <span className="metric-secondary-number">{reports.length}</span>
                <p className="metric-secondary-caption">Filed activity reports.</p>
              </div>
              <div className="metric-secondary-footer">
                <span className="summary-link-hint" style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600 }}>
                  View reports &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Members by Chapter Panel */}
      <section className="card panel members-by-chapter-panel" aria-label="Members by Chapter Distribution">
        <div className="panel-header-flex">
          <div>
            <h3>Members by Chapter</h3>
            <p className="muted" style={{ fontSize: '0.8rem', margin: '2px 0 0' }}>
              Members across chapters.
            </p>
          </div>
          <div className="panel-header-badges">
            <span className="scope-chip" style={{ fontSize: '0.76rem' }}>
              {chapterCounts.length} Chapter{chapterCounts.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="btn"
              onClick={() => onNavigate('chapters')}
              style={{ padding: '4px 10px', fontSize: '0.76rem' }}
            >
              View Chapters &rarr;
            </button>
          </div>
        </div>

        {chapterCounts.length > 0 ? (
          <div className="bar-list">
            {chapterCounts.slice(0, 7).map((item) => (
              <div className="bar-row" key={item.id}>
                <span>{item.name}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.count / maxChapterCount) * 100}%` }}></div>
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No chapter data yet. Add chapters and members to see distribution.
          </div>
        )}
      </section>

      {/* Events Overview Panel (Split Layout) */}
      <section className="card panel dashboard-events-big-card" aria-label="Events Overview">
        <div className="events-big-card-header">
          <div className="events-big-card-title-group">
            <h3>Events Overview</h3>
            <p>Activities, gatherings, and attendance.</p>
          </div>
          <div className="events-big-card-pills">
            <span className="metric-pill">
              <strong>{events.length}</strong> Total Events
            </span>
            <span className="metric-pill">
              <strong>{totalRegistrations}</strong> Registrations
            </span>
            <span className="metric-pill">
              <strong>{totalAttended}</strong> Attended
            </span>
            <button
              type="button"
              className="btn blue"
              onClick={() => onNavigate('events')}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Manage Events
            </button>
          </div>
        </div>

        <div className="dashboard-events-split">
          {/* Upcoming Activities Column */}
          <div className="events-column">
            <div className="events-column-header">
              <span className="badge active">UPCOMING</span>
              <h4>Upcoming Activities</h4>
              <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.76rem' }}>
                {upcomingEvents.length} scheduled
              </span>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="mini-list">
                {upcomingEvents.map((evt) => (
                  <div className="mini-row" key={evt.id}>
                    <div>
                      <strong>{evt.title || evt.name}</strong>
                      <div className="muted">{evt.location || evt.venue || 'No venue'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {formatShortDate(evt.event_date || evt.eventDate || evt.date)}
                      </span>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => onNavigate('events')}
                        style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No upcoming events. Future events you add will appear here.
              </div>
            )}
          </div>

          {/* Recent Gatherings Column */}
          <div className="events-column">
            <div className="events-column-header">
              <span className="badge" style={{ background: '#e2e8f0', color: '#475569' }}>
                RECENT
              </span>
              <h4>Recent Gatherings</h4>
              <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.76rem' }}>
                {recentEvents.length} recorded
              </span>
            </div>

            {recentEvents.length > 0 ? (
              <div className="mini-list">
                {recentEvents.map((evt) => (
                  <div className="mini-row" key={evt.id}>
                    <div>
                      <strong>{evt.title || evt.name}</strong>
                      <div className="muted">{evt.location || evt.venue || 'No venue'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {formatShortDate(evt.event_date || evt.eventDate || evt.date)}
                      </span>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => onNavigate('events')}
                        style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No past events yet. Completed events will appear here automatically.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardView;
