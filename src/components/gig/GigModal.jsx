import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { XIcon } from '../icons/Icons';

export function GigModal({ isOpen, onClose, onCreated, members = [] }) {
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (members.length > 0 && !memberId) {
        setMemberId(members[0].id);
      }
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberId) {
      setError('Please select a member.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid contribution amount greater than 0.');
      return;
    }
    if (!date) {
      setError('Please select a contribution date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRequest('/api/gig', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          amount: numAmount,
          date,
          note: notes.trim()
        })
      });

      if (!res.ok) {
        setError(res.error || 'Failed to record contribution.');
        setLoading(false);
        return;
      }

      onCreated(res.contribution);
      onClose();
    } catch (err) {
      setError(err.message || 'Error recording contribution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="gig-modal-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="gig-modal-title" style={{ fontSize: '1.2rem' }}>
            Record GIG Contribution
          </h2>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger-border)',
                marginBottom: '14px',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="gigMemberSelect">
                Member *
              </label>
              {members.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px 0' }}>
                  No members available. Add members in the Directory first.
                </div>
              ) : (
                <select
                  id="gigMemberSelect"
                  className="form-input"
                  value={memberId}
                  onChange={e => setMemberId(e.target.value)}
                  required
                >
                  <option value="">Select a member...</option>
                  {members.map(m => {
                    const fullName = `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.name || `Member #${m.id}`;
                    return (
                      <option key={m.id} value={m.id}>
                        {fullName}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="gigAmountInput">
                  Amount (PHP) *
                </label>
                <input
                  id="gigAmountInput"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  className="form-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gigDateInput">
                  Date *
                </label>
                <input
                  id="gigDateInput"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="gigNotesInput">
                Notes (Optional)
              </label>
              <textarea
                id="gigNotesInput"
                className="form-input"
                rows="3"
                placeholder="Tithes, thanksgiving offering, or general stewardship notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || members.length === 0}>
              {loading ? 'Recording...' : 'Record Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
