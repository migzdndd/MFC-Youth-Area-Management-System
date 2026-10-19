import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, SearchIcon, TrashIcon, ReportsIcon, XIcon } from '../icons/Icons';
import { LoadingState, EmptyState, ErrorState } from '../common/StateViews';

/**
 * HouseholdReportTracker
 * Manages Pastoral Activity Reports (report_type = 'Household')
 * Saves directly to POST /api/reports with offline queueing support.
 */
export function HouseholdReportTracker({ modalOpen, onCloseModal }) {
  const { role, areaId } = useAuth();
  const [reports, setReports] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [formData, setFormData] = useState({
    title: '',
    activity: '',
    activityDate: new Date().toISOString().split('T')[0],
    participantCount: '',
    location: '',
    chapterId: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (modalOpen) setIsModalOpen(true);
  }, [modalOpen]);

  useEffect(() => {
    loadData();
  }, [areaId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, chaptersRes] = await Promise.all([
        apiRequest('/api/reports'),
        apiRequest('/api/chapters')
      ]);

      if (reportsRes?.ok && Array.isArray(reportsRes.reports)) {
        // Filter specifically for Household pastoral reports
        const householdReports = reportsRes.reports.filter(
          r => (r.report_type || r.type) === 'Household'
        );
        setReports(householdReports);
      }
      if (chaptersRes?.ok && Array.isArray(chaptersRes.chapters)) {
        setChapters(chaptersRes.chapters);
        if (chaptersRes.chapters.length > 0 && !formData.chapterId) {
          setFormData(prev => ({ ...prev, chapterId: chaptersRes.chapters[0].id }));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load household reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Please enter a meeting title.');
      return;
    }
    if (!formData.activityDate) {
      setFormError('Please choose the activity date.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const payload = {
      report_type: 'Household',
      type: 'Household',
      title: formData.title.trim(),
      activity: formData.activity.trim() || 'Household Meeting',
      activity_date: formData.activityDate,
      date: formData.activityDate,
      participant_count: parseInt(formData.participantCount, 10) || 0,
      participants: parseInt(formData.participantCount, 10) || 0,
      location: formData.location.trim(),
      chapter_id: formData.chapterId || null,
      chapterId: formData.chapterId || null,
      notes: formData.notes.trim(),
      description: formData.notes.trim()
    };

    try {
      const res = await apiRequest('/api/reports', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setFormError(res.error || 'Failed to save household report.');
        setSubmitting(false);
        return;
      }

      const newRecord = res.report || { ...payload, id: res.id || `local_rep_${Date.now()}` };
      setReports(prev => [newRecord, ...prev]);
      setIsModalOpen(false);
      setFormData({
        title: '',
        activity: '',
        activityDate: new Date().toISOString().split('T')[0],
        participantCount: '',
        location: '',
        chapterId: chapters[0]?.id || '',
        notes: ''
      });
    } catch (err) {
      setFormError(err.message || 'Error saving pastoral household report.');
    } finally {
      setSubmitting(false);
    }
  };

  const chapterMap = new Map(chapters.map(c => [c.id, c.name]));

  const filteredReports = reports.filter(r => {
    const q = search.toLowerCase();
    const title = (r.title || '').toLowerCase();
    const loc = (r.location || '').toLowerCase();
    const act = (r.activity || '').toLowerCase();
    return title.includes(q) || loc.includes(q) || act.includes(q);
  });

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Pastoral Household Reports</h1>
          <p className="view-subtitle">
            Log and review covenant milestone meetings, youth household gatherings, and pastoral check-ins
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ minHeight: '44px' }}
        >
          <PlusIcon size={18} />
          <span>Log Household</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <SearchIcon size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search meetings by title, topic, or venue..."
            className="form-input search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading pastoral household reports..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon={<ReportsIcon size={48} />}
          title="No Household Reports Found"
          description={search ? "No reports match your search query." : "Log your first household meeting using the button above."}
        />
      ) : (
        <div className="table-wrap desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title / Topic</th>
                <th>Chapter</th>
                <th>Attendees</th>
                <th>Location</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(r => (
                <tr key={r.id}>
                  <td>{r.activity_date || r.date || '-'}</td>
                  <td>
                    <strong>{r.title || r.activity || 'Household Meeting'}</strong>
                  </td>
                  <td>{chapterMap.get(r.chapter_id) || r.chapter_name_snapshot || '-'}</td>
                  <td>
                    <span className="badge badge-info">{r.participant_count ?? r.participants ?? 0} youth</span>
                  </td>
                  <td>{r.location || '-'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.notes || r.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="hh-modal-title" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="hh-modal-title" style={{ fontSize: '1.2rem' }}>
                Log Pastoral Household Meeting
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {formError && (
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="hhTitle">Meeting Title / Topic *</label>
                  <input
                    id="hhTitle"
                    type="text"
                    required
                    placeholder="e.g., God is Love Household Discussion"
                    className="form-input"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="hhDate">Date *</label>
                    <input
                      id="hhDate"
                      type="date"
                      required
                      className="form-input"
                      value={formData.activityDate}
                      onChange={e => setFormData({ ...formData, activityDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="hhAttendees">Participant Count</label>
                    <input
                      id="hhAttendees"
                      type="number"
                      min="0"
                      placeholder="0"
                      className="form-input"
                      value={formData.participantCount}
                      onChange={e => setFormData({ ...formData, participantCount: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="hhChapter">Chapter</label>
                    <select
                      id="hhChapter"
                      className="form-input"
                      value={formData.chapterId}
                      onChange={e => setFormData({ ...formData, chapterId: e.target.value })}
                    >
                      {chapters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="hhLocation">Location / Venue</label>
                    <input
                      id="hhLocation"
                      type="text"
                      placeholder="e.g., Bro. Mark's Residence"
                      className="form-input"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="hhNotes">Pastoral Notes & Action Items</label>
                  <textarea
                    id="hhNotes"
                    rows="3"
                    className="form-input"
                    placeholder="Prayer intentions, covenant growth milestones, pastoral sharing..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Household Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
