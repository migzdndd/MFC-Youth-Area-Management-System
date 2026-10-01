import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, SearchIcon, TrashIcon, GigIcon } from '../icons/Icons';
import { LoadingState, EmptyState, ErrorState } from '../common/StateViews';
import { GigModal } from './GigModal';

export function GigView({ modalOpen, onCloseModal }) {
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
      console.warn('[GigView] Error loading GIG records:', err);
      setError(err.message || 'Failed to load GIG stewardship records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newContrib) => {
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

    if (c.contribution_date) {
      const [y, m] = c.contribution_date.split('-');
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
      const matchMonth = c.contribution_date?.slice(0, 7);
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
          <h1 className="view-title">GIG Stewardship & Tithes</h1>
          <p className="view-subtitle">
            God Is Generous stewardship records, member tithes, and pastoral financial reporting
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
            <span>Record Contribution</span>
          </button>
        )}
      </div>

      {/* Metrics Counter Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Collections</div>
          <div className="stat-value" style={{ color: 'var(--color-success)', fontSize: '1.6rem' }}>
            {formatPhp(totalAmount)}
          </div>
          <div className="stat-sub">All-time recorded stewardship</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">YTD Collections ({currentYear})</div>
          <div className="stat-value" style={{ color: 'var(--mfc-blue)', fontSize: '1.6rem' }}>
            {formatPhp(ytdAmount)}
          </div>
          <div className="stat-sub">Year-to-date total</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">MTD Collections</div>
          <div className="stat-value" style={{ fontSize: '1.6rem' }}>
            {formatPhp(mtdAmount)}
          </div>
          <div className="stat-sub">Current month total</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Givers</div>
          <div className="stat-value" style={{ fontSize: '1.6rem' }}>
            {contributingMemberIds.size}
          </div>
          <div className="stat-sub">Members contributing tithes</div>
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
              <option value="ALL">All Time Periods</option>
              <option value={`${currentYear}-${currentMonth}`}>Current Month ({currentYear}-{currentMonth})</option>
              <option value={`${currentYear}-01`}>January {currentYear}</option>
              <option value={`${currentYear}-02`}>February {currentYear}</option>
              <option value={`${currentYear}-03`}>March {currentYear}</option>
              <option value={`${currentYear}-04`}>April {currentYear}</option>
              <option value={`${currentYear}-05`}>May {currentYear}</option>
              <option value={`${currentYear}-06`}>June {currentYear}</option>
              <option value={`${currentYear}-07`}>July {currentYear}</option>
              <option value={`${currentYear}-08`}>August {currentYear}</option>
              <option value={`${currentYear}-09`}>September {currentYear}</option>
              <option value={`${currentYear}-10`}>October {currentYear}</option>
              <option value={`${currentYear}-11`}>November {currentYear}</option>
              <option value={`${currentYear}-12`}>December {currentYear}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content State Rendering */}
      {loading ? (
        <LoadingState message="Loading GIG stewardship records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No GIG Records Found"
          message={search || monthFilter !== 'ALL' ? 'No contribution records match your filter criteria.' : 'No GIG contributions have been logged for this Area yet.'}
          actionText={canManage ? 'Record First Contribution' : null}
          onAction={canManage ? () => setIsModalOpen(true) : null}
        />
      ) : (
        <div className="card table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Chapter</th>
                <th>Amount</th>
                <th>Notes</th>
                {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const member = memberMap.get(c.member_id);
                const memberName = `${member?.first_name || ''} ${member?.last_name || ''}`.trim() || `Member #${c.member_id}`;
                const chapterName = chapterMap.get(c.chapter_id || member?.chapter_id) || 'General';

                return (
                  <tr key={c.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {c.contribution_date || 'N/A'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{memberName}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{chapterName}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem' }}>
                        {formatPhp(c.amount)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {c.notes || 'No notes'}
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDelete(c.id)}
                          aria-label={`Delete record for ${memberName}`}
                          style={{ minHeight: '36px', minWidth: '36px', padding: '6px' }}
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

      {/* Record GIG Modal */}
      <GigModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseModal) onCloseModal();
        }}
        onCreated={handleCreated}
        members={members}
      />
    </div>
  );
}
