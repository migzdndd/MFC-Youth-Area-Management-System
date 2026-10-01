import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../services/api';
import { useOffline } from '../../context/OfflineContext';
import { XIcon, SearchIcon, CheckIcon, SyncIcon } from '../icons/Icons';

export function AttendanceTrackerModal({ isOpen, onClose, event }) {
  const { isOnline } = useOffline();
  const [participants, setParticipants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (isOpen && event) {
      loadEventData();
    }
  }, [isOpen, event]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const [partRes, memRes] = await Promise.all([
        apiRequest(`/api/participants?eventId=${encodeURIComponent(event.id)}`),
        apiRequest('/api/members')
      ]);

      const partList = partRes?.ok ? (partRes.participants || []) : [];
      const memList = memRes?.ok ? (memRes.members || []) : [];

      setMembers(memList);

      // Map members into participant list with defaults if not yet recorded
      const combined = memList.map(m => {
        const existing = partList.find(p => (p.member_id || p.memberId) === m.id);
        return {
          memberId: m.id,
          participantId: existing?.id,
          name: `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`,
          school: m.school || '',
          attended: existing ? (existing.attended || existing.status === 'Attended') : false,
          paid: existing ? !!existing.paid : false,
          notes: existing?.notes || ''
        };
      });

      setParticipants(combined);
    } catch (err) {
      console.warn('[Attendance] Error loading participants:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  const handleToggleAttendance = async (item) => {
    const nextAttended = !item.attended;
    setTogglingId(`att_${item.memberId}`);

    // Optimistic instant update
    setParticipants(prev => prev.map(p => p.memberId === item.memberId ? { ...p, attended: nextAttended } : p));

    try {
      await apiRequest('/api/participants', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          memberId: item.memberId,
          attended: nextAttended,
          paid: item.paid
        })
      });
    } catch (err) {
      console.warn('[Attendance] Sync error on attendance toggle:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleTogglePayment = async (item) => {
    const nextPaid = !item.paid;
    setTogglingId(`pay_${item.memberId}`);

    // Optimistic instant update
    setParticipants(prev => prev.map(p => p.memberId === item.memberId ? { ...p, paid: nextPaid } : p));

    try {
      await apiRequest('/api/participants', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          memberId: item.memberId,
          attended: item.attended,
          paid: nextPaid
        })
      });
    } catch (err) {
      console.warn('[Attendance] Sync error on payment toggle:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = participants.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === 'Present') return matchesSearch && p.attended;
    if (statusFilter === 'Absent') return matchesSearch && !p.attended;
    if (statusFilter === 'Paid') return matchesSearch && p.paid;
    if (statusFilter === 'Unpaid') return matchesSearch && !p.paid;
    return matchesSearch;
  });

  const presentCount = participants.filter(p => p.attended).length;
  const paidCount = participants.filter(p => p.paid).length;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tracker-modal-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px', height: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 id="tracker-modal-title" style={{ fontSize: '1.25rem' }}>
                Attendance & Payment Tracker
              </h2>
              {!isOnline && (
                <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                  Offline Ready
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {event.title || event.name} • {event.event_date || event.eventDate} {event.location ? `• ${event.location}` : ''}
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close tracker">
            <XIcon size={18} />
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.88rem'
          }}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Total: <strong>{participants.length}</strong></span>
            <span style={{ color: 'var(--color-success)' }}>Present: <strong>{presentCount}</strong></span>
            <span style={{ color: 'var(--mfc-blue)' }}>Paid: <strong>{paidCount}</strong></span>
            {event.fee > 0 && (
              <span style={{ color: 'var(--text-muted)' }}>
                Fee: ₱{event.fee} (Collected: ₱{paidCount * event.fee})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <SearchIcon size={14} />
              </span>
              <input
                type="search"
                placeholder="Search member..."
                className="form-input"
                style={{ paddingLeft: '32px', minHeight: '34px', fontSize: '0.82rem', width: '160px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ minHeight: '34px', fontSize: '0.82rem', width: '120px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All ({participants.length})</option>
              <option value="Present">Present ({presentCount})</option>
              <option value="Absent">Absent ({participants.length - presentCount})</option>
              <option value="Paid">Paid ({paidCount})</option>
              <option value="Unpaid">Unpaid ({participants.length - paidCount})</option>
            </select>
          </div>
        </div>

        {/* Participant Attendance Checklist */}
        <div className="modal-body" style={{ padding: '12px 24px' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading participants roster...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No members found matching filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((item) => (
                <div
                  key={item.memberId}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: item.attended ? 'var(--color-success-bg)' : 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    {item.school && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.school}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Attendance Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(item)}
                      className={`btn btn-sm ${item.attended ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        backgroundColor: item.attended ? 'var(--color-success)' : undefined,
                        borderColor: item.attended ? 'var(--color-success)' : undefined,
                        color: item.attended ? '#ffffff' : undefined,
                        minWidth: '95px'
                      }}
                    >
                      {item.attended ? '✓ Present' : 'Mark Present'}
                    </button>

                    {/* Payment Toggle (if applicable) */}
                    <button
                      type="button"
                      onClick={() => handleTogglePayment(item)}
                      className={`btn btn-sm ${item.paid ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        minWidth: '85px',
                        backgroundColor: item.paid ? 'var(--mfc-blue)' : undefined,
                        borderColor: item.paid ? 'var(--mfc-blue)' : undefined,
                        color: item.paid ? '#ffffff' : undefined
                      }}
                    >
                      {item.paid ? '✓ Paid' : 'Unpaid'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
