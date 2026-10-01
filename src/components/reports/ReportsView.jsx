import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { ReportModal } from './ReportModal';
import { LoadingView, EmptyView, ErrorView } from '../common/StateViews';
import {
  ReportsIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SyncIcon
} from '../icons/Icons';

export function ReportsView({ modalOpen, onCloseModal }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeModalReport, setActiveModalReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewReport, setViewReport] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setActiveModalReport(null);
      setIsModalOpen(true);
    }
  }, [modalOpen]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/api/reports');
      if (res?.ok) {
        setReports(res.reports || []);
      }
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
        setReports(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r));
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

  if (loading) return <LoadingView message="Loading Area Activity Reports..." />;
  if (error && reports.length === 0) return <ErrorView title="Reports Error" error={error} onRetry={loadReports} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem' }}>Youth Activity Reports</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Document assemblies, youth camps, and pastoral fruit across your Area
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadReports}>
            <SyncIcon size={14} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setActiveModalReport(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon size={16} />
            Draft Report
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <EmptyView
          icon={ReportsIcon}
          title="No reports filed yet"
          description="Document your community's monthly assembly, pastoral concerns, and camp activities."
          actionLabel="Draft First Report"
          onAction={() => {
            setActiveModalReport(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {reports.map((rep) => {
            const dateStr = rep.activity_date || rep.activityDate || '';
            const attendees = rep.attendance_count ?? rep.attendanceCount ?? 0;

            return (
              <div key={rep.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-info">
                      {rep.category || rep.report_type || 'Report'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {dateStr}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                    {rep.title || rep.name}
                  </h3>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    👥 Attendees: <strong>{attendees}</strong>
                  </div>

                  {rep.highlights && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '14px', maxHeight: '72px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rep.highlights}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setViewReport(rep)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    View Details
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ width: '34px', height: '34px', padding: '6px' }}
                      title="Edit Report"
                      aria-label={`Edit ${rep.title}`}
                      onClick={() => {
                        setActiveModalReport(rep);
                        setIsModalOpen(true);
                      }}
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ width: '34px', height: '34px', padding: '6px', color: 'var(--color-danger)' }}
                      title="Delete Report"
                      aria-label={`Delete ${rep.title}`}
                      onClick={() => setDeleteTarget(rep)}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseModal) onCloseModal();
        }}
        onSave={handleSaveReport}
        report={activeModalReport}
      />

      {/* Full Report Details Modal */}
      {viewReport && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="view-report-title" onClick={() => setViewReport(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-info">{viewReport.category || 'Report'}</span>
                <h2 id="view-report-title" style={{ fontSize: '1.25rem', marginTop: '6px' }}>
                  {viewReport.title}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Activity Date: {viewReport.activity_date || viewReport.activityDate} • Attendees: {viewReport.attendance_count ?? viewReport.attendanceCount}
                </div>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                  Highlights & Pastoral Fruit
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {viewReport.highlights || 'No highlights provided.'}
                </p>
              </div>

              {viewReport.financial_notes && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                    Financial Summary
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {viewReport.financial_notes}
                  </p>
                </div>
              )}

              {viewReport.concerns && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                    Prayer Intentions & Pastoral Concerns
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {viewReport.concerns}
                  </p>
                </div>
              )}
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
