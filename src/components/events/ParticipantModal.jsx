import React, { useState, useEffect } from 'react';
import { XIcon, SearchIcon, CheckIcon } from '../icons/Icons';

export function ParticipantModal({
  isOpen,
  onClose,
  onSave,
  participant,
  eventId,
  members = [],
  existingParticipants = []
}) {
  const isEdit = !!participant;

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [attended, setAttended] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set of member IDs already registered for this event (excluding current participant being edited)
  const registeredMemberIds = new Set(
    existingParticipants
      .filter(p => !participant || p.id !== participant.id)
      .map(p => p.memberId || p.member_id)
      .filter(Boolean)
      .map(String)
  );

  const availableMembers = members.filter(
    m => !registeredMemberIds.has(String(m.id))
  );

  const filteredMembers = availableMembers.filter(m => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.toLowerCase();
    const chapter = (m.chapter_name || m.chapterName || '').toLowerCase();
    const contact = (m.contact_number || m.contact || '').toLowerCase();
    const services = Array.isArray(m.services) ? m.services.join(' ').toLowerCase() : '';
    return name.includes(q) || chapter.includes(q) || contact.includes(q) || services.includes(q);
  });

  useEffect(() => {
    if (participant) {
      setSelectedMemberId(participant.memberId || participant.member_id || '');
      setPaymentMode(participant.paymentMode || participant.mode_of_payment || 'Cash');
      setPaymentStatus(participant.paymentStatus || participant.payment_status || (participant.paid ? 'Paid' : 'Unpaid'));
      setAttended(Boolean(participant.attended));
    } else {
      setSelectedMemberId(availableMembers[0]?.id || '');
      setPaymentMode('Cash');
      setPaymentStatus('Unpaid');
      setAttended(false);
      setMemberSearch('');
    }
    setError('');
  }, [participant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !selectedMemberId) {
      setError('Please select a registered youth member.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSave({
        id: participant?.id,
        eventId,
        memberId: selectedMemberId || participant?.memberId || participant?.member_id,
        paymentMode,
        paymentStatus,
        attended
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save participant.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMember = members.find(m => String(m.id) === String(selectedMemberId)) ||
    (participant ? {
      firstName: participant.first || participant.first_name || 'Member',
      lastName: participant.last || participant.last_name || '',
      chapterName: participant.chapter || participant.chapter_name || '',
      contact: participant.contact || ''
    } : null);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="participant-modal-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="participant-modal-title" style={{ fontSize: '1.2rem' }}>
            {isEdit ? 'Edit Participant' : 'Register Participant'}
          </h2>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)', marginBottom: '16px', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            {isEdit ? (
              <div className="form-group">
                <label className="form-label">Registered Member</label>
                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle, #f8fafc)', border: '1px solid var(--border-subtle, #e2e8f0)' }}>
                  <strong>{selectedMember?.firstName || selectedMember?.first_name} {selectedMember?.lastName || selectedMember?.last_name}</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedMember?.chapterName || selectedMember?.chapter_name || 'No chapter'} · {selectedMember?.contact || selectedMember?.contact_number || 'No contact'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="participantMemberSearch">Select Registered Member *</label>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <SearchIcon size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    id="participantMemberSearch"
                    type="search"
                    className="form-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="Search registered members..."
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                </div>

                {availableMembers.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    All registered members are already participants in this event.
                  </div>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column' }}>
                    {filteredMembers.map(m => {
                      const isSelected = String(selectedMemberId) === String(m.id);
                      const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMemberId(m.id)}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: isSelected ? 'rgba(0, 40, 71, 0.08)' : 'transparent',
                            borderBottom: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.88rem' }}>{name}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {m.chapter_name || m.chapterName || 'No Chapter'} · {m.contact_number || m.contact || 'No Contact'}
                            </div>
                          </div>
                          {isSelected && <CheckIcon size={16} color="var(--mfc-blue, #002847)" />}
                        </div>
                      );
                    })}
                    {filteredMembers.length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        No registered members match your search.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="pMode">Mode of Payment</label>
                <select
                  id="pMode"
                  className="form-select"
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="GCash">GCash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pPay">Payment Status</label>
                <select
                  id="pPay"
                  className="form-select"
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={attended}
                  onChange={e => setAttended(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                Mark as attended
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Participant' : 'Register Participant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
