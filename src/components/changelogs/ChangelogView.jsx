import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { ChangelogIcon, BookIcon, CheckIcon } from '../icons/Icons';
import { LoadingState, ErrorState } from '../common/StateViews';

export function ChangelogView() {
  const [activeTab, setActiveTab] = useState('changelog'); // 'changelog' | 'guide'
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChangelogs();
  }, []);

  const loadChangelogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/api/changelogs');
      if (res?.ok && Array.isArray(res.commits)) {
        setCommits(res.commits);
      }
    } catch (err) {
      console.warn('[ChangelogView] Error loading changelogs:', err);
      setError(err.message || 'Unable to retrieve changelogs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">System Transparency & Guide</h1>
          <p className="view-subtitle">
            Release changelogs, security audit updates, and servant leader onboarding documentation
          </p>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'changelog' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('changelog')}
          style={{ minHeight: '44px' }}
        >
          <ChangelogIcon size={18} />
          <span>Release Notes & Changelog</span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'guide' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('guide')}
          style={{ minHeight: '44px' }}
        >
          <BookIcon size={18} />
          <span>Servant Leader Guide</span>
        </button>
      </div>

      {activeTab === 'changelog' ? (
        loading ? (
          <LoadingState message="Loading release history..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadChangelogs} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {commits.map((c, idx) => {
              const messageLines = (c.commit?.message || 'Update').split('\n');
              const title = messageLines[0];
              const desc = messageLines.slice(1).join('\n').trim();
              const dateStr = c.commit?.author?.date
                ? new Date(c.commit.author.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recent';

              return (
                <div key={c.sha || idx} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      {title}
                    </div>
                    <span className="badge badge-info" style={{ whiteSpace: 'nowrap' }}>
                      {dateStr}
                    </span>
                  </div>

                  {desc && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', whiteSpace: 'pre-line', margin: '8px 0' }}>
                      {desc}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-surface-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                      {(c.sha || '').slice(0, 7)}
                    </span>
                    <span>by {c.commit?.author?.name || 'MFC Tech Team'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Servant Leader Onboarding Guide */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
              1. Pastoral Mission & Purpose
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px' }}>
              The MFC Youth Area Management System is designed to support the evangelistic mission of Missionary Families for Christ. It enables coordinators and servant leaders to steward youth demographic profiles, track attendance, and log activities with transparency and security.
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
              2. Roles and Permissions (RBAC)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-secondary)' }}>
                <div style={{ fontWeight: 700, color: 'var(--mfc-blue)', marginBottom: '6px' }}>Area Administrators</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Includes <strong>National Coordinators</strong>, <strong>Couple Coordinators</strong>, <strong>Area Servants</strong>, and Ministry Servants. Full oversight of area members, chapters, events, GIG records, and reporting.
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-secondary)' }}>
                <div style={{ fontWeight: 700, color: 'var(--mfc-blue)', marginBottom: '6px' }}>Chapter Servants</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Scoped strictly to their assigned Chapter. Can manage members, take event attendance, and file chapter activity reports without accessing other chapters.
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-secondary)' }}>
                <div style={{ fontWeight: 700, color: 'var(--mfc-blue)', marginBottom: '6px' }}>Youth Members</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Self-service portal access to view their own profile, household information, event history, payment statuses, and GIG donation records.
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
              3. Data Privacy and Pastoral Ethics
            </h2>
            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li style={{ marginBottom: '8px' }}>
                All personal information (contact numbers, home addresses, family details) is confidential and may only be used for direct pastoral care.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Servant leaders must not share access passwords or export member data to unauthorized personal storage or social media.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Enable Two-Factor Authentication (MFA) in Settings to safeguard leadership access.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
