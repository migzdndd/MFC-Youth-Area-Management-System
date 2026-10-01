import React, { useState, useEffect } from 'react';
import { XIcon } from '../icons/Icons';

export function ReportModal({ isOpen, onClose, onSave, report }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Monthly Report',
    activityDate: new Date().toISOString().split('T')[0],
    attendanceCount: '0',
    highlights: '',
    financialNotes: '',
    concerns: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (report) {
      setFormData({
        title: report.title || report.name || '',
        category: report.category || report.report_type || 'Monthly Report',
        activityDate: report.activity_date || report.activityDate || new Date().toISOString().split('T')[0],
        attendanceCount: String(report.attendance_count ?? report.attendanceCount ?? '0'),
        highlights: report.highlights || report.content || '',
        financialNotes: report.financial_notes || report.financialNotes || '',
        concerns: report.concerns || ''
      });
    } else {
      setFormData({
        title: '',
        category: 'Monthly Report',
        activityDate: new Date().toISOString().split('T')[0],
        attendanceCount: '0',
        highlights: '',
        financialNotes: '',
        concerns: ''
      });
    }
    setError('');
  }, [report, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Report title is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSave({
        id: report?.id,
        title: formData.title.trim(),
        category: formData.category,
        activity_date: formData.activityDate,
        attendance_count: parseInt(formData.attendanceCount, 10) || 0,
        highlights: formData.highlights.trim(),
        financial_notes: formData.financialNotes.trim(),
        concerns: formData.concerns.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="report-modal-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="report-modal-title" style={{ fontSize: '1.2rem' }}>
            {report ? 'Edit Activity Report' : 'Draft Youth Activity Report'}
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
              <label className="form-label" htmlFor="reportTitle">Report Title *</label>
              <input
                id="reportTitle"
                name="title"
                type="text"
                required
                className="form-input"
                placeholder="e.g. October Youth Assembly & Service Fellowship"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reportCategory">Report Category</label>
                <select
                  id="reportCategory"
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Monthly Report">Monthly Report</option>
                  <option value="Youth Camp">Youth Camp Report</option>
                  <option value="Chapter Report">Chapter / Unit Report</option>
                  <option value="Financial Summary">Financial Summary</option>
                  <option value="Service Ministry">Service Ministry Report</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="attendanceCount">Total Attendees</label>
                <input
                  id="attendanceCount"
                  name="attendanceCount"
                  type="number"
                  min="0"
                  className="form-input"
                  value={formData.attendanceCount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="activityDate">Activity Date</label>
              <input
                id="activityDate"
                name="activityDate"
                type="date"
                required
                className="form-input"
                value={formData.activityDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="highlights">Activity Highlights & Narrative</label>
              <textarea
                id="highlights"
                name="highlights"
                className="form-textarea"
                rows="3"
                placeholder="Key activities, spiritual fruit, and testimonies..."
                value={formData.highlights}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="financialNotes">Financial Summary (Collections & Expenses)</label>
              <textarea
                id="financialNotes"
                name="financialNotes"
                className="form-textarea"
                rows="2"
                placeholder="Registration fees collected, venue and food costs..."
                value={formData.financialNotes}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="concerns">Prayer Intentions & Pastoral Concerns</label>
              <textarea
                id="concerns"
                name="concerns"
                className="form-textarea"
                rows="2"
                placeholder="Prayer requests, pastoral guidance needed from Area leaders..."
                value={formData.concerns}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : report ? 'Update Report' : 'Save Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
