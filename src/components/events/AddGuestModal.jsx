import React, { useState } from 'react';
import { XIcon, PlusIcon } from '../icons/Icons';
import { enqueueMutation } from '../../services/offlineStore';

export function AddGuestModal({
  isOpen,
  onClose,
  event,
  onGuestAdded
}) {
  const [nonMemberName, setNonMemberName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [modeOfPayment, setModeOfPayment] = useState('Cash');
  const [attended, setAttended] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !event) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nonMemberName.trim()) {
      setError('Please enter the guest full name.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      eventId: event.id,
      nonMemberName: nonMemberName.trim(),
      paymentStatus,
      modeOfPayment,
      attended
    };

    try {
      if (typeof onGuestAdded === 'function') {
        await onGuestAdded(payload);
      } else {
        // Fallback optimistic offline mutation enqueueing
        await enqueueMutation('participants', 'POST', payload);
      }
      setNonMemberName('');
      setPaymentStatus('Paid');
      setModeOfPayment('Cash');
      setAttended(true);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register guest attendee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-guest-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="add-guest-title" style={{ fontSize: '1.2rem', marginBottom: '2px' }}>
              Add Walk-In / Guest Attendee
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {event.name || event.title}
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Guest Attendee Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '0.9rem' }}
                placeholder="e.g. Maria Clara Santos"
                value={nonMemberName}
                onChange={e => setNonMemberName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Payment Status
                </label>
                <select
                  className="form-control"
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '0.9rem' }}
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                >
                  <option value="Paid">Paid</option>
                  <option value="Not Paid">Not Paid</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Mode of Payment
                </label>
                <select
                  className="form-control"
                  style={{ width: '100%', minHeight: '44px', padding: '8px 12px', fontSize: '0.9rem' }}
                  value={modeOfPayment}
                  onChange={e => setModeOfPayment(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="GCash">GCash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Waived">Waived</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
              <input
                type="checkbox"
                id="guest-attended"
                checked={attended}
                onChange={e => setAttended(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="guest-attended" style={{ fontSize: '0.88rem', cursor: 'pointer', userSelect: 'none' }}>
                Mark as Checked-in / Attended immediately
              </label>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting} style={{ minHeight: '44px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlusIcon size={16} />
              {submitting ? 'Registering...' : 'Register Walk-In Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
