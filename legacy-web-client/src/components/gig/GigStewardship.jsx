import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, SearchIcon, TrashIcon, GigIcon } from '../icons/Icons';
import { LoadingState, EmptyState, ErrorState } from '../common/StateViews';
import { GigModal } from './GigModal';

export function GigStewardship({ modalOpen, onCloseModal }) {
  const { role, areaId } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      setIsModalOpen(true);
    }
  }, [modalOpen]);

  useEffect(() => {
    loadData();
  }, [areaId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gigRes, membersRes, chaptersRes] = await Promise.all([
        apiRequest('/api/gig'),
        apiRequest('/api/members'),
        apiRequest('/api/chapters')
      ]);

      if (gigRes?.ok && Array.isArray(gigRes.gig)) {
        setContributions(gigRes.gig);
      }
      if (membersRes?.ok && Array.isArray(membersRes.members)) {
        setMembers(membersRes.members);
      }
      if (chaptersRes?.ok && Array.isArray(chaptersRes.chapters)) {
        setChapters(chaptersRes.chapters);
      }
    } catch (err) {
      console.warn('[GigStewardship] Error loading GIG records:', err);
      setError(err.message || 'Failed to load GIG stewardship records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newContrib) => {
    if (!newContrib) return;
    setContributions(prev => [newContrib, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this contribution record?')) {
      return;
    }
    try {
      await apiRequest(`/api/gig?id=${id}`, { method: 'DELETE' });
      setContributions(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete contribution record.');
    }
  };

  // Helper map for member names and chapter names
  const memberMap = new Map(members.map(m => [m.id, m]));
  const chapterMap = new Map(chapters.map(c => [c.id, c.name]));

  // Financial Metrics Calculation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

  let totalAmount = 0;
  let ytdAmount = 0;
  let mtdAmount = 0;
  const contributingMemberIds = new Set();

  contributions.forEach(c => {
    const amt = parseFloat(c.amount) || 0;
    totalAmount += amt;
    if (c.member_id) contributingMemberIds.add(c.member_id);

    const contribDate = c.contribution_date || c.date;
    if (contribDate) {
      const [y, m] = contribDate.split('-');
      if (parseInt(y, 10) === currentYear) {
        ytdAmount += amt;
        if (m === currentMonth) {
          mtdAmount += amt;
        }
      }
    }
  });

  const formatPhp = (val) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(val);
  };

  // Filtered List
  const filtered = contributions.filter(c => {
    const member = memberMap.get(c.member_id);
    const memberName = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || '';
    const noteText = c.notes || '';
    const matchesSearch = memberName.toLowerCase().includes(search.toLowerCase()) ||
                          noteText.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (monthFilter !== 'ALL') {
      const matchMonth = (c.contribution_date || c.date)?.slice(0, 7);
      if (matchMonth !== monthFilter) return false;
    }

    return true;
  });

  const canManage = role !== 'member';

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">G.I.G. Stewardship Ledger</h1>
          <p className="view-subtitle">
            God is Generous voluntary financial tithing, love offerings, and stewardship reporting
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ minHeight: '44px' }}
          >
            <PlusIcon size={18} />
            <span>Record Offering</span>
          </button>
        )}
      </div>

      {/* Metrics Counter Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Month-to-Date (MTD)</div>
          <div className="stat-value" style={{ color: 'var(--color-success)', fontSize: '1.6rem' }}>
            {formatPhp(mtdAmount)}
          </div>
          <div className="stat-sub">Current month voluntary giving</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Year-to-Date (YTD)</div>
          <div className="stat-value" style={{ color: 'var(--mfc-blue)', fontSize: '1.6rem' }}>
            {formatPhp(ytdAmount)}
          </div>
          <div className="stat-sub">Year {currentYear} contributions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Givers</div>
          <div className="stat-value" style={{ fontSize: '1.6rem' }}>
            {contributingMemberIds.size}
          </div>
          <div className="stat-sub">Total unique participating givers</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">All-Time G.I.G. Total</div>
          <div className="stat-value" style={{ fontSize: '1.6rem' }}>
            {formatPhp(totalAmount)}
          </div>
          <div className="stat-sub">Cumulative offering ledger</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <SearchIcon size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by member name or note..."
              className="form-input search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-input"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
            >
              <option value="ALL">All Recorded Dates</option>
              <option value={`${currentYear}-${currentMonth}`}>Current Month ({currentYear}-{currentMonth})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Content */}
      {loading ? (
        <LoadingState message="Loading G.I.G. stewardship ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GigIcon size={48} />}
          title="No G.I.G. Records Found"
          description={search ? "No contribution records match your search filter." : "Start recording God is Generous contributions using the button above."}
        />
      ) : (
        <div className="table-wrap desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Chapter</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Notes</th>
                {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const member = memberMap.get(item.member_id);
                const memberName = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || `Member #${item.member_id}`;
                const chapterName = chapterMap.get(item.chapter_id || member?.chapter_id) || '-';

                return (
                  <tr key={item.id}>
                    <td>{item.contribution_date || item.date || '-'}</td>
                    <td>
                      <strong>{memberName}</strong>
                    </td>
                    <td>{chapterName}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                      {formatPhp(parseFloat(item.amount) || 0)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {item.notes || '-'}
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleDelete(item.id)}
                          aria-label="Delete contribution record"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mobile-only mobile-card-list">
          {filtered.map(item => {
            const member = memberMap.get(item.member_id);
            const memberName = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || `Member #${item.member_id}`;

            return (
              <div key={item.id} className="card" style={{ padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{memberName}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      📅 {item.contribution_date || item.date || '-'}
                    </div>
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-success)' }}>
                    {formatPhp(parseFloat(item.amount) || 0)}
                  </strong>
                </div>
                {item.notes && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    "{item.notes}"
                  </div>
                )}
                {canManage && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(item.id)}
                      style={{ color: 'var(--color-danger)' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record Contribution Modal */}
      {isModalOpen && (
        <GigModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            if (onCloseModal) onCloseModal();
          }}
          onCreated={handleCreated}
          members={members}
        />
      )}
    </div>
  );
}

// Retain alias for backwards compatibility
export const GigView = GigStewardship;
