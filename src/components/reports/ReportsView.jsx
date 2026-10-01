import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ReportModal } from './ReportModal';
import { LoadingView, EmptyView, ErrorView, TableSkeleton } from '../common/StateViews';
import {
  ReportsIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SyncIcon,
  PrintIcon,
  XIcon
} from '../icons/Icons';

const REPORT_TYPES = [
  'Core Household',
  'Household',
  'Assembly',
  'Fellowship'
];

export function ReportsView({ modalOpen, onCloseModal }) {
  const { role, user } = useAuth();
  const isChapterServant = role === 'chapter_servant';

  const [reports, setReports] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [activeModalReport, setActiveModalReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewReport, setViewReport] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setActiveModalReport(null);
      setIsModalOpen(true);
    }
  }, [modalOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [repRes, chapRes] = await Promise.all([
        apiRequest('/api/reports'),
        apiRequest('/api/chapters')
      ]);

      if (repRes?.ok) setReports(repRes.reports || []);
      if (chapRes?.ok) setChapters(chapRes.chapters || []);
    } catch (err) {
      setError(err.message || 'Unable to load activity reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async (data) => {
    const isEdit = !!data.id;
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await apiRequest('/api/reports', {
      method,
      body: JSON.stringify(data)
    });

    if (res?.ok) {
      if (isEdit) {
        setReports(prev => prev.map(r => (r.id === data.id ? { ...r, ...data } : r)));
      } else {
        const newObj = {
          ...data,
          id: res.id || `local_rep_${Date.now()}`
        };
        setReports(prev => [newObj, ...prev]);
      }
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/reports?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE'
      });
      setReports(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete report: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  // Chapter scoping
  const userChapterId = user?.chapter_id || user?.chapterId || chapters[0]?.id;
  const currentChapter = chapters.find(c => String(c.id) === String(userChapterId));

  const visibleReports = useMemo(() => {
    if (isChapterServant && currentChapter) {
      return reports.filter(
        r => String(r.chapter_id || r.chapterId) === String(currentChapter.id) || r.chapter === currentChapter.name
      );
    }
    return reports;
  }, [reports, isChapterServant, currentChapter]);

  const filtered = useMemo(() => {
    return visibleReports.filter(rep => {
      const text = `
        ${rep.title || ''}
        ${rep.activity || ''}
        ${rep.prepared_by || rep.preparedBy || ''}
        ${rep.description || rep.highlights || ''}
        ${rep.location || ''}
      `.toLowerCase();

      if (search && !text.includes(search.toLowerCase().trim())) return false;
      if (selectedChapter !== 'All' && rep.chapter !== selectedChapter) return false;
      if (selectedType !== 'All' && (rep.type || rep.category) !== selectedType) return false;

      const rDate = rep.date || rep.activity_date || rep.activityDate;
      if (dateFrom && rDate && rDate < dateFrom) return false;
      if (dateTo && rDate && rDate > dateTo) return false;

      return true;
    }).sort((a, b) => {
      const da = new Date(a.date || a.activity_date || a.activityDate || 0).getTime();
      const db = new Date(b.date || b.activity_date || b.activityDate || 0).getTime();
      return db - da;
    });
  }, [visibleReports, search, selectedChapter, selectedType, dateFrom, dateTo]);

  // Statistics calculation
  const totalActivities = filtered.length;
  const totalParticipants = filtered.reduce((sum, r) => sum + (parseInt(r.participants ?? r.attendance_count ?? 0, 10)), 0);
  const averageAttendance = totalActivities > 0 ? Math.round(totalParticipants / totalActivities) : 0;
  const chaptersInvolved = new Set(filtered.map(r => r.chapter).filter(Boolean)).size;

  // Monthly 6-month chart
  const months = useMemo(() => {
    return [...Array(6)].map((_, idx) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - idx));

      const count = filtered.filter(rep => {
        const rdStr = rep.date || rep.activity_date || rep.activityDate;
        if (!rdStr) return false;
        const rd = new Date(rdStr);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      }).length;

      return {
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        count
      };
    });
  }, [filtered]);

  const maxMonthCount = Math.max(...months.map(m => m.count), 1);

  if (loading) return <TableSkeleton rows={5} columns={6} title="Loading Area Activity Reports..." />;
  if (error && reports.length === 0) return <ErrorView title="Reports Error" error={error} onRetry={loadData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header (H1) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
            Activity Reports
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
            {isChapterServant
              ? `Reports for ${currentChapter?.name || 'Assigned'} Chapter.`
              : 'Reports, analytics, and exports.'}
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn blue"
            onClick={() => {
              setActiveModalReport(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon size={16} />
            + Add Report
          </button>
          <button type="button" className="btn" onClick={handlePrintSummary}>
            <PrintIcon size={15} />
            Print Summary
          </button>
          <button type="button" className="btn" onClick={handlePrintSummary}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Top Metric Stat Cards (Grid of 4) */}
      <div className="stat-grid">
        <section className="card stat-card">
          <span>Matching Reports</span>
          <strong>{totalActivities}</strong>
        </section>
        <section className="card stat-card">
          <span>Total Participants</span>
          <strong>{totalParticipants}</strong>
        </section>
        <section className="card stat-card">
          <span>Chapters Involved</span>
          <strong>{chaptersInvolved}</strong>
        </section>
        <section className="card stat-card">
          <span>Average Attendance</span>
          <strong>{averageAttendance}</strong>
        </section>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
          <input
            type="search"
            className="search-input"
            placeholder="Search title, activity, preparer, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {!isChapterServant && (
          <div style={{ flex: '0 1 160px' }}>
            <select
              className="select-input compact-filter"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="All">Chapter: All</option>
              {chapters.map(c => (
                <option key={c.id} value={c.name || c.chapter_name}>{c.name || c.chapter_name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ flex: '0 1 150px' }}>
          <select
            className="select-input compact-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="All">Type: All</option>
            {REPORT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From:</span>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.84rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To:</span>
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.84rem' }}
          />
        </div>

        {(search || selectedChapter !== 'All' || selectedType !== 'All' || dateFrom || dateTo) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('');
              setSelectedChapter('All');
              setSelectedType('All');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Primary Card: Activity Records Table & Mobile Cards */}
      <section className="card panel report-primary-card" aria-label="Activity Records">
        <div className="report-primary-header" style={{ marginBottom: '14px' }}>
          <div className="report-primary-title-group">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <span className="metric-badge-primary">Primary</span>
              <span className="scope-chip">{filtered.length} {filtered.length === 1 ? 'Report' : 'Reports'} Found</span>
            </div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '1.2rem' }}>Activity Records</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Detailed log of activities, attendance turnout, and filed submissions
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyView
            icon={ReportsIcon}
            title="No activity reports"
            description={reports.length ? 'No records match the selected filters.' : 'Add a report to start your analytics.'}
            actionLabel="+ Add Report"
            onAction={() => {
              setActiveModalReport(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <>
            {/* Desktop Table (≥ 1024px) */}
            <div className="table-wrap desktop-only-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Report Title</th>
                    <th>Chapter</th>
                    <th>Type</th>
                    <th>Participants</th>
                    <th>Location</th>
                    <th>Prepared By</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rep) => {
                    const rDate = rep.date || rep.activity_date || rep.activityDate;
                    const rType = rep.type || rep.category || 'Household';
                    const rParticipants = rep.participants ?? rep.attendance_count ?? 0;

                    return (
                      <tr key={rep.id}>
                        <td>{formatDate(rDate)}</td>
                        <td>
                          <strong>{rep.title}</strong>
                          {rep.activity && <div className="muted" style={{ fontSize: '0.78rem' }}>{rep.activity}</div>}
                        </td>
                        <td>{rep.chapter || '-'}</td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{rType}</span>
                        </td>
                        <td>{rParticipants}</td>
                        <td>{rep.location || '-'}</td>
                        <td>{rep.prepared_by || rep.preparedBy || '-'}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => setViewReport(rep)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => {
                              setActiveModalReport(rep);
                              setIsModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm red"
                            onClick={() => setDeleteTarget(rep)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< 1024px) */}
            <div className="mobile-card-list">
              {filtered.map((rep) => {
                const rDate = rep.date || rep.activity_date || rep.activityDate;
                const rType = rep.type || rep.category || 'Household';
                const rParticipants = rep.participants ?? rep.attendance_count ?? 0;

                return (
                  <div key={rep.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                          {rep.title}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatDate(rDate)} • {rep.chapter || 'No Chapter'}
                        </span>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                        {rType}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>👥 Participants: <strong>{rParticipants}</strong></span>
                      {rep.location && <span>📍 {rep.location}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ flex: 1, minHeight: '44px', justifyContent: 'center' }}
                        onClick={() => setViewReport(rep)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ flex: 1, minHeight: '44px', justifyContent: 'center' }}
                        onClick={() => {
                          setActiveModalReport(rep);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn red"
                        style={{ minHeight: '44px', padding: '0 14px' }}
                        onClick={() => setDeleteTarget(rep)}
                        aria-label={`Delete ${rep.title}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Secondary Card: Monthly Trend Chart Panel */}
      <section className="card panel report-secondary-card" aria-label="Monthly Activity Trend">
        <div className="report-secondary-header" style={{ marginBottom: '16px' }}>
          <div className="report-secondary-title-group">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <span className="metric-badge-secondary">Secondary</span>
              <span className="scope-chip">Past 6 Months</span>
            </div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '1.2rem' }}>Monthly Activity</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Activity count distribution and monthly turnout trends
            </p>
          </div>
        </div>

        <div className="chart-bars report-chart-bars" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', height: '140px', padding: '10px 0' }}>
          {months.map((m) => {
            const barPercent = Math.max((m.count / maxMonthCount) * 100, 8);
            return (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {m.count}
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: `${barPercent}%`,
                    background: 'var(--mfc-blue)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add / Edit Report Form Modal */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseModal) onCloseModal();
        }}
        onSave={handleSaveReport}
        report={activeModalReport}
        chapters={chapters}
      />

      {/* View Report Detail Modal */}
      {viewReport && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="view-report-title" onClick={() => setViewReport(null)}>
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-info">{viewReport.type || viewReport.category || 'Household'}</span>
                <h2 id="view-report-title" style={{ fontSize: '1.25rem', marginTop: '6px', margin: 0 }}>
                  {viewReport.title}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {formatDate(viewReport.date || viewReport.activity_date || viewReport.activityDate)} • Chapter: {viewReport.chapter || 'No Chapter'}
                </div>
              </div>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setViewReport(null)}>
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-surface-secondary)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Attendees</span>
                  <strong>{viewReport.participants ?? viewReport.attendance_count ?? 0} participants</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Location</span>
                  <strong>{viewReport.location || 'None specified'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Prepared By</span>
                  <strong>{viewReport.prepared_by || viewReport.preparedBy || 'Servant'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Activity Name</span>
                  <strong>{viewReport.activity || '-'}</strong>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Highlights & Pastoral Notes
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                  {viewReport.description || viewReport.highlights || 'No highlights provided.'}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-rep-title" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="confirm-delete-rep-title" style={{ fontSize: '1.15rem' }}>Confirm Report Deletion</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)' }}>
                Are you sure you want to remove <strong>{deleteTarget.title}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteReport} disabled={deleting}>
                {deleting ? 'Removing...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsView;
