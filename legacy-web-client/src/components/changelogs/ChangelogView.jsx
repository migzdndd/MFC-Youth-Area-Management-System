import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { ChangelogIcon, SearchIcon, SyncIcon } from '../icons/Icons';
import { LoadingView, EmptyView, ErrorView } from '../common/StateViews';

const CATEGORIES = ['All', 'Security', 'Features', 'Database', 'UI/UX'];

export function ChangelogView() {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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
      } else if (res?.ok && Array.isArray(res.changelogs)) {
        setCommits(res.changelogs);
      }
    } catch (err) {
      console.warn('[ChangelogView] Error loading changelogs:', err);
      setError(err.message || 'Unable to retrieve changelogs.');
    } finally {
      setLoading(false);
    }
  };

  const detectCategory = (message = '') => {
    const lower = message.toLowerCase();
    if (lower.includes('sec') || lower.includes('auth') || lower.includes('mfa') || lower.includes('pass') || lower.includes('protect')) return 'Security';
    if (lower.includes('feat') || lower.includes('add') || lower.includes('new') || lower.includes('portal')) return 'Features';
    if (lower.includes('db') || lower.includes('schema') || lower.includes('sql') || lower.includes('supabase') || lower.includes('migrate')) return 'Database';
    if (lower.includes('ui') || lower.includes('style') || lower.includes('css') || lower.includes('layout') || lower.includes('theme') || lower.includes('mobile')) return 'UI/UX';
    return 'Features';
  };

  const filteredCommits = commits.filter(c => {
    const message = c.commit?.message || c.title || c.description || '';
    const author = c.commit?.author?.name || c.author || '';
    const sha = c.sha || '';
    const textMatch = `${message} ${author} ${sha}`.toLowerCase().includes(search.toLowerCase());
    if (!textMatch) return false;

    if (selectedCategory !== 'All') {
      const cat = c.category || detectCategory(message);
      if (cat !== selectedCategory) return false;
    }

    return true;
  });

  const getCategoryCount = (cat) => {
    if (cat === 'All') return commits.length;
    return commits.filter(c => {
      const msg = c.commit?.message || c.title || c.description || '';
      return (c.category || detectCategory(msg)) === cat;
    }).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>System Changelogs</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Version release history, security patches, and deployment logs.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadChangelogs}
          style={{ minHeight: '44px' }}
        >
          <SyncIcon size={14} />
          Sync Logs
        </button>
      </div>

      {/* Control Deck: Search & Category Pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="search"
            className="search-input"
            style={{ width: '100%', paddingLeft: '38px', minHeight: '44px' }}
            placeholder="Search commits by message, author, or SHA..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setSelectedCategory(cat)}
              >
                <span>{cat}</span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle, #f1f5f9)'
                }}>
                  {getCategoryCount(cat)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingView message="Loading release history..." />
      ) : error && commits.length === 0 ? (
        <ErrorView title="Changelogs" error={error} onRetry={loadChangelogs} />
      ) : filteredCommits.length === 0 ? (
        <EmptyView
          icon={ChangelogIcon}
          title="No matching logs"
          description={commits.length ? 'Try changing your search terms or category filter.' : 'No commits recorded yet.'}
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('All');
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredCommits.map((c, idx) => {
            const rawMessage = c.commit?.message || c.title || c.description || 'System Update';
            const messageLines = rawMessage.split('\n');
            const title = messageLines[0];
            const desc = messageLines.slice(1).join('\n').trim();
            const cat = c.category || detectCategory(rawMessage);
            const dateStr = c.commit?.author?.date || c.date
              ? new Date(c.commit?.author?.date || c.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent';

            const badgeVariant =
              cat === 'Security' ? 'badge-danger' :
              cat === 'Database' ? 'badge-warning' :
              cat === 'UI/UX' ? 'badge-info' : 'badge-success';

            return (
              <div key={c.sha || idx} className="card" style={{ padding: '20px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className={`badge ${badgeVariant}`} style={{ fontSize: '0.72rem' }}>
                      {cat}
                    </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                      {title}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {dateStr}
                  </span>
                </div>

                {desc && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', whiteSpace: 'pre-line', margin: '8px 0', lineHeight: 1.5 }}>
                    {desc}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {c.sha && (
                    <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-subtle, #f1f5f9)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      {c.sha.slice(0, 7)}
                    </span>
                  )}
                  <span>by {c.commit?.author?.name || c.author || 'MFC Tech Team'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
