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
          paymentMode: existing?.mode_of_payment || 'Cash',
          paymentStatus: existing?.payment_status || (existing?.paid ? 'Paid' : 'Pending'),
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
      if (item.participantId) {
        await apiRequest('/api/participants', {
          method: 'PATCH',
          body: JSON.stringify({
            id: item.participantId,
            attended: nextAttended,
            paymentMode: item.paymentMode,
            paymentStatus: item.paymentStatus
          })
        });
      } else {
        const res = await apiRequest('/api/participants', {
          method: 'POST',
          body: JSON.stringify({
            eventId: event.id,
            memberId: item.memberId,
            attended: nextAttended,
            paymentMode: item.paymentMode,
            paymentStatus: item.paymentStatus
          })
        });
        if (res?.participant?.id) {
          setParticipants(prev => prev.map(p => p.memberId === item.memberId ? { ...p, participantId: res.participant.id } : p));
        }
      }
    } catch (err) {
      console.warn('[Attendance] Sync error on attendance toggle:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleUpdatePaymentStatus = async (item, newStatus) => {
    setTogglingId(`pay_${item.memberId}`);

    // Optimistic instant update
    setParticipants(prev => prev.map(p => p.memberId === item.memberId ? { ...p, paymentStatus: newStatus } : p));

    try {
      if (item.participantId) {
        await apiRequest('/api/participants', {
          method: 'PATCH',
          body: JSON.stringify({
            id: item.participantId,
            attended: item.attended,
            paymentMode: item.paymentMode,
            paymentStatus: newStatus
          })
        });
      } else {
        const res = await apiRequest('/api/participants', {
          method: 'POST',
          body: JSON.stringify({
            eventId: event.id,
            memberId: item.memberId,
            attended: item.attended,
            paymentMode: item.paymentMode,
            paymentStatus: newStatus
          })
        });
        if (res?.participant?.id) {
          setParticipants(prev => prev.map(p => p.memberId === item.memberId ? { ...p, participantId: res.participant.id } : p));
        }
      }
    } catch (err) {
      console.warn('[Attendance] Sync error on payment update:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleUpdatePaymentMode = async (item, newMode) => {
    setParticipants(prev => prev.map(p => p.memberId === item.memberId ? { ...p, paymentMode: newMode } : p));

    if (item.participantId) {
      try {
        await apiRequest('/api/participants', {
          method: 'PATCH',
          body: JSON.stringify({
            id: item.participantId,
            attended: item.attended,
            paymentMode: newMode,
            paymentStatus: item.paymentStatus
          })
        });
      } catch (err) {
        console.warn('[Attendance] Sync error on payment mode update:', err);
      }
    }
  };

  const presentCount = participants.filter(p => p.attended).length;
  const paidCount = participants.filter(p => p.paymentStatus === 'Paid').length;
  const pendingCount = participants.filter(p => p.paymentStatus === 'Pending').length;

  const filtered = participants.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.school.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'Present') return p.attended;
    if (statusFilter === 'Absent') return !p.attended;
    if (statusFilter === 'Paid') return p.paymentStatus === 'Paid';
    if (statusFilter === 'Pending') return p.paymentStatus === 'Pending';
    if (statusFilter === 'Waived') return p.paymentStatus === 'Waived';

    return true;
  });

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tracker-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px', width: '95%' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mfc-blue)', fontWeight: 600 }}>
              Live Event Check-in & Payments
            </span>
            <h2 id="tracker-title" style={{ fontSize: '1.25rem', marginTop: '2px' }}>
              {event.title}
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {event.venue ? `${event.venue} · ` : ''}{event.event_date || 'Upcoming'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={loadEventData}
              title="Refresh roster"
            >
              <SyncIcon size={16} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Counter Summary Bar */}
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
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>Total: <strong>{participants.length}</strong></span>
            <span style={{ color: 'var(--color-success)' }}>Present: <strong>{presentCount}</strong></span>
            <span style={{ color: 'var(--mfc-blue)' }}>Paid: <strong>{paidCount}</strong></span>
            <span style={{ color: 'var(--color-warning)' }}>Pending: <strong>{pendingCount}</strong></span>
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
              style={{ minHeight: '34px', fontSize: '0.82rem', width: '130px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All ({participants.length})</option>
              <option value="Present">Present ({presentCount})</option>
              <option value="Absent">Absent ({participants.length - presentCount})</option>
              <option value="Paid">Paid ({paidCount})</option>
              <option value="Pending">Pending ({pendingCount})</option>
              <option value="Waived">Waived</option>
            </select>
          </div>
        </div>

        {/* Participant Attendance Checklist */}
        <div className="modal-body" style={{ padding: '12px 24px', maxHeight: '420px', overflowY: 'auto' }}>
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
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      {item.name}
                    </div>
                    {item.school && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.school}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Payment Mode Selector */}
                    {event.fee > 0 && (
                      <select
                        className="form-select"
                        style={{ minHeight: '32px', fontSize: '0.78rem', width: '100px' }}
                        value={item.paymentMode}
                        onChange={e => handleUpdatePaymentMode(item, e.target.value)}
                        aria-label="Payment Mode"
                      >
                        <option value="Cash">Cash</option>
                        <option value="GCash">GCash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    )}

                    {/* Payment Status Selector */}
                    {event.fee > 0 && (
                      <select
                        className="form-select"
                        style={{
                          minHeight: '32px',
                          fontSize: '0.78rem',
                          width: '100px',
                          color: item.paymentStatus === 'Paid' ? 'var(--color-success)' : item.paymentStatus === 'Waived' ? 'var(--mfc-blue)' : 'var(--color-warning)',
                          fontWeight: 600
                        }}
                        value={item.paymentStatus}
                        onChange={e => handleUpdatePaymentStatus(item, e.target.value)}
                        aria-label="Payment Status"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Waived">Waived</option>
                      </select>
                    )}

                    {/* Attendance Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(item)}
                      className={`btn btn-sm ${item.attended ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        backgroundColor: item.attended ? 'var(--color-success)' : undefined,
                        borderColor: item.attended ? 'var(--color-success)' : undefined,
                        color: item.attended ? '#ffffff' : undefined,
                        minWidth: '105px',
                        minHeight: '34px'
                      }}
                    >
                      {item.attended ? '✓ Attended' : 'Mark Attended'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Attendance & payment updates synchronize automatically when connected.
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
