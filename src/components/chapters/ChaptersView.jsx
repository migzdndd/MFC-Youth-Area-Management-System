import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChapterModal } from './ChapterModal';
import { AssignMembersModal } from './AssignMembersModal';
import { MemberDetailModal } from '../members/MemberDetailModal';
import { LoadingView, EmptyView, ErrorView, TableSkeleton } from '../common/StateViews';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  MembersIcon,
  SyncIcon
} from '../icons/Icons';

export function ChaptersView() {
  const { role, user } = useAuth();
  const isChapterServant = role === 'chapter_servant';

  const [chapters, setChapters] = useState([]);
  const [members, setMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [gig, setGig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [chapterSearch, setChapterSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editChapter, setEditChapter] = useState(null);
  const [assignChapter, setAssignChapter] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Mobile segmented tab for Chapter Servant
  const [mobileTab, setMobileTab] = useState('roster'); // 'roster' | 'reports'

  // View member detail modal
  const [detailMember, setDetailMember] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chapRes, memRes, repRes, gigRes] = await Promise.all([
        apiRequest('/api/chapters'),
        apiRequest('/api/members'),
        apiRequest('/api/reports'),
        apiRequest('/api/gig')
      ]);

      if (chapRes?.ok) setChapters(chapRes.chapters || []);
      if (memRes?.ok) setMembers(memRes.members || []);
      if (repRes?.ok) setReports(repRes.reports || []);
      if (gigRes?.ok) setGig(gigRes.gig || []);
    } catch (err) {
      setError(err.message || 'Unable to load chapters.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChapter = async (data) => {
    const isEdit = !!data.id;
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await apiRequest('/api/chapters', {
      method,
      body: JSON.stringify(data)
    });

    if (res?.ok) {
      if (isEdit) {
        setChapters(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
      } else {
        const newObj = {
          ...data,
          id: res.id || `local_chap_${Date.now()}`
        };
        setChapters(prev => [...prev, newObj]);
      }
    }
  };

  const handleDeleteChapter = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/chapters?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE'
      });
      setChapters(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete chapter: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amt || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  if (loading) return <TableSkeleton rows={4} columns={5} title="Loading Area Chapters..." />;
  if (error && chapters.length === 0) return <ErrorView title="Chapters Error" error={error} onRetry={loadData} />;

  // CHAPTER SERVANT SCOPED VIEW
  if (isChapterServant) {
    const userChapterId = user?.chapter_id || user?.chapterId || chapters[0]?.id;
    const currentChapter = chapters.find(c => String(c.id) === String(userChapterId));

    if (!currentChapter) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px 0' }}>Chapter Dashboard</h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
              Your Chapter Servant account is not assigned to a chapter yet.
            </p>
          </div>
          <div style={{ padding: '28px', textAlign: 'center', background: 'var(--bg-surface-secondary)', borderRadius: '14px' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Ask an Area Servant, Area LIT Servant, Campus Servant, Area Kids Servant, or Couple Coordinator to assign your member record to a chapter.
            </p>
          </div>
        </div>
      );
    }

    const chapterMembers = members.filter(m => String(m.chapter_id || m.chapterId) === String(currentChapter.id));
    const activeMembers = chapterMembers.filter(m => (m.status || 'Active') === 'Active');
    const chapterReports = reports.filter(r => String(r.chapter_id || r.chapterId) === String(currentChapter.id) || r.chapter === currentChapter.name);

    const chapterMemberIds = new Set(chapterMembers.map(m => String(m.id)));
    const chapterGig = gig.filter(g => chapterMemberIds.has(String(g.member_id || g.memberId)));
    const totalGig = chapterGig.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);

    const unassignedMembers = members.filter(m => !m.chapter_id && !m.chapterId);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header (H1) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
              {currentChapter.name || currentChapter.chapter_name} Chapter
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
              Dashboard for {currentChapter.name || currentChapter.chapter_name} Chapter.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadData}
              title="Refresh chapter data"
            >
              <SyncIcon size={14} />
              Refresh
            </button>
            <button
              type="button"
              className="btn blue"
              onClick={() => setAssignChapter(currentChapter)}
            >
              + Add Unassigned Members
            </button>
          </div>
        </div>

        {/* Scope Banner */}
        <div className="chapter-scope-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-secondary)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--mfc-blue)', display: 'block' }}>
              CHAPTER SERVANT ACCESS
            </span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
              {currentChapter.name || currentChapter.chapter_name} Chapter
            </strong>
          </div>
          <span className="scope-chip">
            {unassignedMembers.length} unassigned member{unassignedMembers.length === 1 ? '' : 's'} available
          </span>
        </div>

        {/* Quick Stat Cards (Grid of 4) */}
        <div className="stat-grid">
          <section className="card stat-card">
            <span>Chapter Members</span>
            <strong>{chapterMembers.length}</strong>
          </section>

          <section className="card stat-card">
            <span>Active Members</span>
            <strong>{activeMembers.length}</strong>
          </section>

          <section className="card stat-card">
            <span>Activity Reports</span>
            <strong>{chapterReports.length}</strong>
          </section>

          <section className="card stat-card">
            <span>Total Chapter GIG</span>
            <strong>{formatCurrency(totalGig)}</strong>
          </section>
        </div>

        {/* Mobile Segmented Tab Control */}
        <div className="mobile-segmented-control" style={{ display: 'none', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${mobileTab === 'roster' ? 'blue' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setMobileTab('roster')}
          >
            Roster ({chapterMembers.length})
          </button>
          <button
            type="button"
            className={`btn ${mobileTab === 'reports' ? 'blue' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setMobileTab('reports')}
          >
            Reports ({chapterReports.length})
          </button>
        </div>

        {/* 2-Column Split: Chapter Roster vs Chapter Activity Reports */}
        <div className="grid-2 chapter-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Panel 1: Chapter Roster */}
          <section className={`card panel ${mobileTab !== 'roster' ? 'mobile-hide-panel' : ''}`}>
            <div className="panel-heading-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--mfc-blue)', display: 'block' }}>
                  MEMBERS
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Chapter Roster</h3>
              </div>
              <span className="scope-chip">{chapterMembers.length} total</span>
            </div>

            {chapterMembers.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Status</th>
                      <th>Services</th>
                      <th>GIG</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterMembers.map((m) => {
                      const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.trim() || 'Member';
                      const mServices = Array.isArray(m.services) ? m.services : [];
                      const memberTotalGig = gig
                        .filter(g => String(g.member_id || g.memberId) === String(m.id))
                        .reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);

                      return (
                        <tr key={m.id}>
                          <td>
                            <strong>{name}</strong>
                            {m.email && <div className="muted" style={{ fontSize: '0.78rem' }}>{m.email}</div>}
                          </td>
                          <td>
                            <span className={`badge ${(m.status || 'Active') === 'Active' ? 'active' : 'inactive'}`}>
                              {m.status || 'Active'}
                            </span>
                          </td>
                          <td>
                            {mServices.length > 0 ? mServices.join(', ') : <span className="muted">None</span>}
                          </td>
                          <td>{formatCurrency(memberTotalGig)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => setDetailMember({ ...m, chapterName: currentChapter.name })}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No chapter members assigned yet. Use Add Unassigned Members above.
              </div>
            )}
          </section>

          {/* Panel 2: Chapter Activity Reports */}
          <section className={`card panel ${mobileTab !== 'reports' ? 'mobile-hide-panel' : ''}`}>
            <div className="panel-heading-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--mfc-blue)', display: 'block' }}>
                  REPORTS
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Chapter Activity Reports</h3>
              </div>
              <span className="scope-chip">{chapterReports.length} filed</span>
            </div>

            {chapterReports.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Activity</th>
                      <th>Participants</th>
                      <th>Prepared By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterReports.map((r) => (
                      <tr key={r.id}>
                        <td>{formatDate(r.date || r.report_date)}</td>
                        <td>
                          <strong>{r.title || r.activity || 'Activity'}</strong>
                          {r.type && <div className="muted" style={{ fontSize: '0.78rem' }}>{r.type}</div>}
                        </td>
                        <td>{r.participants || 0}</td>
                        <td>{r.prepared_by || r.preparedBy || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No activity reports filed for this chapter yet.
              </div>
            )}
          </section>
        </div>

        {/* Modals */}
        <AssignMembersModal
          isOpen={!!assignChapter}
          onClose={() => {
            setAssignChapter(null);
            loadData();
          }}
          chapter={assignChapter}
          unassignedMembers={unassignedMembers}
        />

        <MemberDetailModal
          isOpen={!!detailMember}
          onClose={() => setDetailMember(null)}
          member={detailMember}
          gigHistory={gig}
        />
      </div>
    );
  }

  // AREA ADMIN VIEW
  const filteredChapters = chapters.filter(c =>
    (c.name || c.chapter_name || '').toLowerCase().includes(chapterSearch.toLowerCase().trim())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header (H1) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
            Chapters
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
            Chapters and assigned rosters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
            <SyncIcon size={14} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditChapter(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon size={16} />
            + Add Chapter
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="search"
          className="search-input"
          placeholder="Search chapters..."
          value={chapterSearch}
          onChange={(e) => setChapterSearch(e.target.value)}
          style={{ maxWidth: '340px' }}
        />
        {chapterSearch && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setChapterSearch('')}>
            Clear
          </button>
        )}
      </div>

      {/* Chapter Cards / Table */}
      {filteredChapters.length === 0 ? (
        <EmptyView
          icon={MembersIcon}
          title="No chapters found"
          description="Create your first chapter to begin assigning youth members."
          actionLabel="+ Add Chapter"
          onAction={() => {
            setEditChapter(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredChapters.map((chap) => {
            const chapMembers = members.filter(m => String(m.chapter_id || m.chapterId) === String(chap.id));
            const activeCount = chapMembers.filter(m => (m.status || 'Active') === 'Active').length;

            return (
              <div key={chap.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                      {chap.name || chap.chapter_name}
                    </h3>
                    <span className="badge badge-info">
                      {chapMembers.length} member{chapMembers.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    <div>Active: <strong>{activeCount}</strong></div>
                    <div>Leader: <strong>{chap.servant_name || chap.servantName || 'Not assigned'}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setAssignChapter(chap)}
                  >
                    Assign Members
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ width: '34px', height: '34px', padding: '6px' }}
                      title="Edit Chapter"
                      onClick={() => {
                        setEditChapter(chap);
                        setIsModalOpen(true);
                      }}
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ width: '34px', height: '34px', padding: '6px', color: 'var(--color-danger)' }}
                      title="Delete Chapter"
                      onClick={() => setDeleteTarget(chap)}
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

      {/* Chapter Add/Edit Modal */}
      <ChapterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditChapter(null);
        }}
        onSave={handleSaveChapter}
        chapter={editChapter}
      />

      {/* Assign Members Modal */}
      <AssignMembersModal
        isOpen={!!assignChapter}
        onClose={() => {
          setAssignChapter(null);
          loadData();
        }}
        chapter={assignChapter}
        unassignedMembers={members.filter(m => !m.chapter_id && !m.chapterId)}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-chap-title" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="confirm-delete-chap-title" style={{ fontSize: '1.15rem' }}>Confirm Chapter Deletion</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)' }}>
                Are you sure you want to remove chapter <strong>{deleteTarget.name || deleteTarget.chapter_name}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteChapter} disabled={deleting}>
                {deleting ? 'Removing...' : 'Delete Chapter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChaptersView;
