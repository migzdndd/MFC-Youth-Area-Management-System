import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { ChapterModal } from './ChapterModal';
import { AssignMembersModal } from './AssignMembersModal';
import { LoadingView, EmptyView, ErrorView } from '../common/StateViews';
import {
  ChaptersIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  MembersIcon,
  SyncIcon
} from '../icons/Icons';

export function ChaptersView() {
  const [chapters, setChapters] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editChapter, setEditChapter] = useState(null);
  const [assignChapter, setAssignChapter] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chapRes, memRes] = await Promise.all([
        apiRequest('/api/chapters'),
        apiRequest('/api/members')
      ]);

      if (chapRes?.ok) {
        setChapters(chapRes.chapters || []);
      }
      if (memRes?.ok) {
        setMembers(memRes.members || []);
      }
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

  const getMemberCount = (chapterId) => {
    return members.filter(m => (m.chapter_id || m.chapterId) === chapterId).length;
  };

  if (loading) return <LoadingView message="Loading Area Chapters..." />;
  if (error && chapters.length === 0) return <ErrorView title="Chapters Error" error={error} onRetry={loadData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem' }}>Chapters & Community Units</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Parish communities, households, and units in this Area
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
            Create Chapter
          </button>
        </div>
      </div>

      {chapters.length === 0 ? (
        <EmptyView
          icon={ChaptersIcon}
          title="No chapters created yet"
          description="Create your first chapter or parish unit to begin organizing youth members."
          actionLabel="Create First Chapter"
          onAction={() => {
            setEditChapter(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {chapters.map((chap) => {
            const memberCount = getMemberCount(chap.id);
            return (
              <div key={chap.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
                      {chap.name || chap.chapter_name}
                    </h3>
                    <span className="badge badge-info">
                      {memberCount} member{memberCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Leader: <strong>{chap.servant_name || chap.servantName || 'Not assigned'}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAssignChapter(chap)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    <MembersIcon size={14} />
                    Assign Members
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ width: '34px', height: '34px', padding: '6px' }}
                      title="Edit Chapter"
                      aria-label={`Edit ${chap.name || chap.chapter_name}`}
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
                      aria-label={`Delete ${chap.name || chap.chapter_name}`}
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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChapter}
        chapter={editChapter}
      />

      {/* Member Assignment Modal */}
      <AssignMembersModal
        isOpen={!!assignChapter}
        onClose={() => setAssignChapter(null)}
        chapter={assignChapter}
        onAssigned={loadData}
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
                Are you sure you want to remove <strong>{deleteTarget.name || deleteTarget.chapter_name}</strong>?
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
