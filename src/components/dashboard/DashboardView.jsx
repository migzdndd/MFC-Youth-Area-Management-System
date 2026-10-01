import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import {
  MembersIcon,
  ChaptersIcon,
  EventsIcon,
  ReportsIcon,
  ScriptureIcon,
  PlusIcon,
  SyncIcon,
  GigIcon
} from '../icons/Icons';
import { LoadingView, ErrorView } from '../common/StateViews';

export function DashboardView({ onNavigate, onOpenNewMember, onOpenNewEvent, onOpenNewReport, onOpenNewGig }) {
  const { role, areaId, areaName } = useAuth();
  const { isOnline } = useOffline();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    membersCount: 0,
    youthCount: 0,
    kidsCount: 0,
    chaptersCount: 0,
    eventsCount: 0,
    reportsCount: 0,
    ytdGig: 0,
    mtdGig: 0
  });
  const [reading, setReading] = useState(null);
  const [readingLoading, setReadingLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadDailyReading();
  }, [areaId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch with offline caching support in apiRequest
      const [membersRes, chaptersRes, eventsRes, reportsRes, gigRes] = await Promise.allSettled([
        apiRequest('/api/members'),
        apiRequest('/api/chapters'),
        apiRequest('/api/events'),
        apiRequest('/api/reports'),
        apiRequest('/api/gig')
      ]);

      const members = membersRes.status === 'fulfilled' && membersRes.value?.ok ? (membersRes.value.members || []) : [];
      const chapters = chaptersRes.status === 'fulfilled' && chaptersRes.value?.ok ? (chaptersRes.value.chapters || []) : [];
      const events = eventsRes.status === 'fulfilled' && eventsRes.value?.ok ? (eventsRes.value.events || []) : [];
      const reports = reportsRes.status === 'fulfilled' && reportsRes.value?.ok ? (reportsRes.value.reports || []) : [];
      const gig = gigRes.status === 'fulfilled' && gigRes.value?.ok ? (gigRes.value.gig || []) : [];

      // Calculate Youth vs Kids breakdown by age or category
      let youth = 0;
      let kids = 0;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

      members.forEach(m => {
        const cat = String(m.category || m.ministry_branch || '').toLowerCase();
        if (cat.includes('kid')) {
          kids++;
        } else if (m.birth_date) {
          const birthYear = new Date(m.birth_date).getFullYear();
          const age = currentYear - birthYear;
          if (age < 13) kids++;
          else youth++;
        } else {
          youth++;
        }
      });

      // Calculate GIG YTD and MTD
      let ytd = 0;
      let mtd = 0;
      gig.forEach(g => {
        const amt = parseFloat(g.amount) || 0;
        if (g.contribution_date) {
          const [y, m] = g.contribution_date.split('-');
          if (parseInt(y, 10) === currentYear) {
            ytd += amt;
            if (m === currentMonth) mtd += amt;
          }
        }
      });

      setStats({
        membersCount: members.length,
        youthCount: youth,
        kidsCount: kids,
        chaptersCount: chapters.length,
        eventsCount: events.length,
        reportsCount: reports.length,
        ytdGig: ytd,
        mtdGig: mtd
      });
    } catch (err) {
      console.warn('[Dashboard] Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyReading = async () => {
    setReadingLoading(true);
    try {
      const res = await apiRequest('/api/daily-readings');
      if (res?.ok && res.readings) {
        setReading(res.readings);
      }
    } catch {
      // Graceful fallback if offline
    } finally {
      setReadingLoading(false);
    }
  };

  const formatPhp = (val) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return <LoadingView message="Loading Area Dashboard metrics..." />;
  }

  if (error && stats.membersCount === 0) {
    return <ErrorView title="Dashboard Error" error={error} onRetry={loadDashboardData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome & Area banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--mfc-navy) 0%, var(--mfc-navy-dark) 100%)',
          color: '#ffffff',
          padding: '24px 28px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mfc-cyan)', fontWeight: 600 }}>
              Missionary Families of Christ - Youth & Kids Ministries
            </span>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginTop: '4px' }}>
              {areaName ? `${areaName} Area Portal` : 'Area Youth Management'}
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.92rem', marginTop: '4px' }}>
              Servant leadership hub for youth membership, community events, GIG stewardship, and pastoral reports.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadDashboardData}
              title="Refresh area records"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'transparent' }}
            >
              <SyncIcon size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('members')}>
          <div className="stat-icon">
            <MembersIcon size={24} />
          </div>
          <div>
            <div className="stat-number">{stats.membersCount}</div>
            <div className="stat-label">Total Members</div>
            <div className="stat-sub" style={{ marginTop: '4px' }}>
              {stats.youthCount} Youth · {stats.kidsCount} Kids
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('chapters')}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-success)' }}>
            <ChaptersIcon size={24} />
          </div>
          <div>
            <div className="stat-number">{stats.chaptersCount}</div>
            <div className="stat-label">Chapters & Units</div>
            <div className="stat-sub" style={{ marginTop: '4px' }}>Active Area Units</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('events')}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(217, 119, 6, 0.12)', color: 'var(--color-warning)' }}>
            <EventsIcon size={24} />
          </div>
          <div>
            <div className="stat-number">{stats.eventsCount}</div>
            <div className="stat-label">Upcoming Events</div>
            <div className="stat-sub" style={{ marginTop: '4px' }}>Camps & Assemblies</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('gig')}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.12)', color: 'var(--color-info)' }}>
            <GigIcon size={24} />
          </div>
          <div>
            <div className="stat-number" style={{ color: 'var(--color-success)' }}>{formatPhp(stats.ytdGig)}</div>
            <div className="stat-label">YTD GIG Stewardship</div>
            <div className="stat-sub" style={{ marginTop: '4px' }}>MTD: {formatPhp(stats.mtdGig)}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Daily Scripture */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Quick Actions Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Role-Based Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={onOpenNewMember}
            >
              <PlusIcon size={18} />
              <span>Register New Youth / Kid Member</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={onOpenNewEvent}
            >
              <EventsIcon size={18} />
              <span>Schedule Youth Event / Assembly</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={onOpenNewReport}
            >
              <ReportsIcon size={18} />
              <span>Draft Activity Report (Offline Ready)</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={onOpenNewGig}
            >
              <GigIcon size={18} />
              <span>Record GIG Stewardship / Tithes</span>
            </button>
          </div>
        </div>

        {/* Daily Liturgical Reading Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ScriptureIcon size={20} />
              <h3 className="card-title">Daily Scripture Reflection</h3>
            </div>
            {reading?.date && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reading.date}</span>
            )}
          </div>

          {readingLoading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading scripture reading...
            </div>
          ) : reading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--mfc-blue)' }}>
                {reading.title || reading.gospel_title || 'Holy Gospel'}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, maxHeight: '160px', overflowY: 'auto' }}>
                {reading.gospel || reading.content || reading.summary || 'Word of the Lord.'}
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                onClick={() => onNavigate('readings')}
              >
                View Full Liturgical Readings
              </button>
            </div>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Daily reading feed available online and cached for offline meditation.
              <div style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('readings')}>
                  Open Daily Readings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
