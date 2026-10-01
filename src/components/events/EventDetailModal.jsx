import React from 'react';
import { XIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon } from '../icons/Icons';

export function EventDetailModal({
  isOpen,
  onClose,
  event,
  participants = [],
  members = [],
  isAreaAdmin = true,
  onRegisterParticipant,
  onEditParticipant,
  onDeleteParticipant
}) {
  if (!isOpen || !event) return null;

  const eventName = event.name || event.title || 'Event Details';
  const eventDate = event.date || event.event_date || '';
  const venue = event.venue || event.location || '-';
  const fee = parseFloat(event.fee ?? event.registration_fee ?? 0);
  const description = event.description || '';

  const paidCount = participants.filter(p => (p.paymentStatus || p.payment_status) === 'Paid' || p.paid).length;
  const attendedCount = participants.filter(p => p.attended || p.status === 'Attended').length;

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

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const b = new Date(birthDate);
    if (Number.isNaN(b.getTime())) return '-';
    const diff = Date.now() - b.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="event-detail-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div>
            <h2 id="event-detail-title" style={{ fontSize: '1.25rem', marginBottom: '2px' }}>
              {eventName}
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {venue} · {fmtDateTime(eventDate)}
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
          {/* Summary Metrics Grid */}
          <div className="event-summary" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            padding: '16px',
            backgroundColor: 'var(--bg-subtle, #f8fafc)',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Date & Time</span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{fmtDateTime(eventDate)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Venue</span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{venue}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Registration Fee</span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{fee > 0 ? `₱${fee}` : 'Free'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Registered</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--mfc-blue, #002847)' }}>{participants.length}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Paid</span>
              <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>{paidCount}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Attended</span>
              <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>{participants.length ? attendedCount : Number(event.peopleAttended || 0)}</strong>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="event-description" style={{
              fontSize: '0.9rem',
              lineHeight: 1.5,
              color: 'var(--text-main)',
              marginBottom: '20px',
              padding: '12px 14px',
              backgroundColor: 'rgba(0, 40, 71, 0.03)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--mfc-blue)'
            }}>
              {description}
            </p>
          )}

          {/* Participants Heading & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Participants ({participants.length})
            </h3>
            {isAreaAdmin ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onRegisterParticipant}
              >
                <PlusIcon size={14} />
                + Register Participant
              </button>
            ) : (
              <span className="badge badge-info">View Only</span>
            )}
          </div>

          {/* Participant Roster Table (Desktop) / Cards (Mobile) */}
          {participants.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>No participants yet</p>
              <p style={{ fontSize: '0.85rem' }}>Register the first participant for this event.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-wrap desktop-only" style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflowX: 'auto' }}>
                <table className="data-table compact-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Age</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Chapter</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Service</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Payment</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Attendance</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(p => {
                      const member = members.find(m => String(m.id) === String(p.memberId || p.member_id));
                      const name = member ? `${member.first_name || member.firstName} ${member.last_name || member.lastName}` : (p.name || `${p.first || ''} ${p.last || ''}`.trim() || 'Unknown');
                      const age = member ? calculateAge(member.birth_date || member.birthDate) : (p.age || '-');
                      const chapter = member ? (member.chapter_name || member.chapterName) : (p.chapter || '-');
                      const services = member ? (Array.isArray(member.services) ? member.services.join(', ') : member.services) : (p.service || '-');
                      const isPaid = (p.paymentStatus || p.payment_status) === 'Paid' || p.paid;
                      const isAttended = p.attended || p.status === 'Attended';

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{name}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{age}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{chapter || '-'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{services || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.75rem' }}>
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className={`badge ${isAttended ? 'badge-info' : 'badge-secondary'}`} style={{ fontSize: '0.75rem' }}>
                              {isAttended ? 'Attended' : 'Not Yet'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {isAreaAdmin ? (
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => onEditParticipant(p)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => onDeleteParticipant(p.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>View only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="mobile-only mobile-card-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {participants.map(p => {
                  const member = members.find(m => String(m.id) === String(p.memberId || p.member_id));
                  const name = member ? `${member.first_name || member.firstName} ${member.last_name || member.lastName}` : (p.name || `${p.first || ''} ${p.last || ''}`.trim() || 'Unknown');
                  const age = member ? calculateAge(member.birth_date || member.birthDate) : (p.age || '-');
                  const chapter = member ? (member.chapter_name || member.chapterName) : (p.chapter || '-');
                  const services = member ? (Array.isArray(member.services) ? member.services.join(', ') : member.services) : (p.service || '-');
                  const isPaid = (p.paymentStatus || p.payment_status) === 'Paid' || p.paid;
                  const isAttended = p.attended || p.status === 'Attended';

                  return (
                    <div key={p.id} className="card" style={{ padding: '14px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {chapter} · Age {age}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                          <span className={`badge ${isAttended ? 'badge-info' : 'badge-secondary'}`} style={{ fontSize: '0.72rem' }}>
                            {isAttended ? 'Attended' : 'Not Yet'}
                          </span>
                        </div>
                      </div>

                      {services && services !== '-' && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--mfc-blue)', marginBottom: '10px' }}>
                          Service: {services}
                        </div>
                      )}

                      {isAreaAdmin && (
                        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, minHeight: '44px' }}
                            onClick={() => onEditParticipant(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ flex: 1, minHeight: '44px' }}
                            onClick={() => onDeleteParticipant(p.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ minHeight: '44px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
