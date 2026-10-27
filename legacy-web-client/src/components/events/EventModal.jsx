import React, { useState, useEffect } from 'react';
import { XIcon } from '../icons/Icons';

export function EventModal({ isOpen, onClose, onSave, event }) {
  const [formData, setFormData] = useState({
    title: '',
    eventType: 'Youth Camp',
    eventDate: '',
    eventTime: '',
    location: '',
    fee: '0',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || event.name || '',
        eventType: event.event_type || event.eventType || 'Youth Camp',
        eventDate: event.event_date || event.eventDate || '',
        eventTime: event.event_time || event.eventTime || '',
        location: event.location || event.venue || '',
        fee: String(event.fee ?? event.registration_fee ?? '0'),
        description: event.description || ''
      });
    } else {
      setFormData({
        title: '',
        eventType: 'Youth Camp',
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: '08:00',
        location: '',
        fee: '0',
        description: ''
      });
    }
    setError('');
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.eventDate) {
      setError('Title and Event Date are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSave({
        id: event?.id,
        title: formData.title.trim(),
        event_type: formData.eventType,
        event_date: formData.eventDate,
        event_time: formData.eventTime,
        location: formData.location.trim(),
        fee: parseFloat(formData.fee) || 0,
        description: formData.description.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="event-modal-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="event-modal-title" style={{ fontSize: '1.2rem' }}>
            {event ? 'Edit Youth Event' : 'Schedule Youth Event'}
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

            <div className="form-group">
              <label className="form-label" htmlFor="eventTitle">Event Title *</label>
              <input
                id="eventTitle"
                name="title"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Area Youth Conference 2026"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="eventType">Event Type</label>
                <select
                  id="eventType"
                  name="eventType"
                  className="form-select"
                  value={formData.eventType}
                  onChange={handleChange}
                >
                  <option value="Youth Camp">Youth Camp</option>
                  <option value="Youth Assembly">Youth Assembly</option>
                  <option value="Conference">Area Conference</option>
                  <option value="Teaching Night">Teaching Night</option>
                  <option value="Household">Household</option>
                  <option value="Fellowship">Fellowship</option>
                  <option value="Mission">Mission Trip</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fee">Registration Fee (PHP)</label>
                <input
                  id="fee"
                  name="fee"
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  value={formData.fee}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="eventDate">Date *</label>
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  required
                  className="form-input"
                  value={formData.eventDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="eventTime">Time</label>
                <input
                  id="eventTime"
                  name="eventTime"
                  type="time"
                  className="form-input"
                  value={formData.eventTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location">Venue / Location</label>
              <input
                id="location"
                name="location"
                type="text"
                className="form-input"
                placeholder="e.g. St. Jude Parish Gymnasium"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Notes / Details</label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                placeholder="Theme, reminders, things to bring..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
