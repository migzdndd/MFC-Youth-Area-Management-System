import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MemberModal } from './MemberModal';
import { MemberDetailModal } from './MemberDetailModal';
import { LoadingView, EmptyView, ErrorView } from '../common/StateViews';
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  MembersIcon,
  SyncIcon
} from '../icons/Icons';

export function MembersView({ modalOpen, onCloseModal }) {
  const { role, user } = useAuth();
  const isChapterServant = role === 'chapter_servant';

  const [members, setMembers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [gigHistory, setGigHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [activeModalMember, setActiveModalMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailMember, setDetailMember] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setActiveModalMember(null);
      setIsModalOpen(true);
    }
  }, [modalOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, chaptersRes, gigRes] = await Promise.all([
        apiRequest('/api/members'),
        apiRequest('/api/chapters'),
        apiRequest('/api/gig')
      ]);

      if (membersRes?.ok) {
        setMembers(membersRes.members || []);
      }
      if (chaptersRes?.ok) {
        setChapters(chaptersRes.chapters || []);
      }
      if (gigRes?.ok) {
        setGigHistory(gigRes.gig || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load member roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async (formData) => {
    const isEdit = !!formData.id;
    const endpoint = '/api/members';
    const method = isEdit ? 'PATCH' : 'POST';

    const payload = {
      id: formData.id,
      first_name: formData.firstName,
      middle_name: formData.middleName,
      last_name: formData.lastName,
      nickname: formData.nickname,
      gender: formData.gender,
      category: 'Youth',
      ministry_branch: 'Youth',
      email: formData.email,
      contact_number: formData.contact,
      birth_date: formData.birthDate,
      school: formData.school,
      academic_track: formData.academicTrack,
      grade_level: formData.gradeLevel,
      address: formData.address,
      household_head: formData.householdHead,
      emergency_contact_person: formData.emergencyContactPerson,
      emergency_contact_number: formData.emergencyContactNumber,
      chapter_id: formData.chapterId || null,
      access_level: formData.accessLevel,
      status: formData.status,
      services: formData.services
    };

    const res = await apiRequest(endpoint, {
      method,
      body: JSON.stringify(payload)
    });

    if (res?.ok) {
      if (isEdit) {
        setMembers(prev =>
          prev.map(m =>
            m.id === formData.id
              ? { ...m, ...payload, firstName: formData.firstName, lastName: formData.lastName }
              : m
          )
        );
      } else {
        const newObj = {
          ...payload,
          id: res.id || `local_${Date.now()}`,
          firstName: formData.firstName,
          lastName: formData.lastName
        };
        setMembers(prev => [newObj, ...prev]);
      }
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/members?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE'
      });
      setMembers(prev => prev.filter(m => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete member: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const getChapterName = (chapterId) => {
    if (!chapterId) return 'Unassigned';
    const c = chapters.find(ch => String(ch.id) === String(chapterId));
    return c?.name || c?.chapter_name || 'Unassigned';
  };

  // Chapter Servant scoping
  const userChapterId = user?.chapter_id || user?.chapterId || chapters[0]?.id;
  const currentChapter = chapters.find(c => String(c.id) === String(userChapterId));

  const visibleMembers = useMemo(() => {
    if (isChapterServant && userChapterId) {
      return members.filter(m => String(m.chapter_id || m.chapterId) === String(userChapterId));
    }
    return members;
  }, [members, isChapterServant, userChapterId]);

  const filteredMembers = useMemo(() => {
    return visibleMembers.filter((m) => {
      const fullName = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.toLowerCase();
      const email = (m.email || '').toLowerCase();
      const school = (m.school || '').toLowerCase();
      const contact = (m.contact_number || m.contact || '').toLowerCase();
      const chName = getChapterName(m.chapter_id || m.chapterId).toLowerCase();
      const mServices = Array.isArray(m.services) ? m.services : [];
      const serviceStr = mServices.join(' ').toLowerCase();

      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        email.includes(term) ||
        school.includes(term) ||
        contact.includes(term) ||
        chName.includes(term) ||
        serviceStr.includes(term);

      const mChapterId = String(m.chapter_id || m.chapterId || '');
      const matchesChapter = !selectedChapter || mChapterId === String(selectedChapter);

      const matchesService = !selectedService || mServices.includes(selectedService);

      const mStatus = m.status || 'Active';
      const matchesStatus = selectedStatus === 'All' || mStatus === selectedStatus;

      return matchesSearch && matchesChapter && matchesService && matchesStatus;
    });
  }, [visibleMembers, search, selectedChapter, selectedService, selectedStatus, chapters]);

  // Unique list of services for filter
  const allAvailableServices = useMemo(() => {
    const set = new Set();
    members.forEach(m => {
      if (Array.isArray(m.services)) {
        m.services.forEach(s => set.add(s));
      }
    });
    return Array.from(set);
  }, [members]);

  if (loading) return <LoadingView message="Loading Area Youth Member Roster..." />;
  if (error && members.length === 0) return <ErrorView title="Members Roster Error" error={error} onRetry={loadData} />;

  // Empty state if Chapter Servant has no assigned chapter
  if (isChapterServant && !currentChapter) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px 0' }}>No chapter assigned.</h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
            Ask an Area Servant, Area LIT Servant, Campus Servant, Area Kids Servant, or Couple Coordinator to assign your account to a chapter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header (H1) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
            Members
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
            {isChapterServant
              ? `Members in ${currentChapter?.name || 'Assigned'} Chapter.`
              : 'Member records, chapters, and services.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            title="Refresh member roster"
          >
            <SyncIcon size={14} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setActiveModalMember(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon size={16} />
            + Add Member
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
          <input
            type="search"
            className="search-input"
            placeholder="Search members, email, contact, chapter, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search members"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ flex: '0 1 140px' }}>
          <select
            className="select-input compact-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by status"
            style={{ width: '100%' }}
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {!isChapterServant && (
          <div style={{ flex: '0 1 170px' }}>
            <select
              className="select-input compact-filter"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              aria-label="Filter by chapter"
              style={{ width: '100%' }}
            >
              <option value="">Chapter: All</option>
              {chapters.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.chapter_name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ flex: '0 1 170px' }}>
          <select
            className="select-input compact-filter"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            aria-label="Filter by service"
            style={{ width: '100%' }}
          >
            <option value="">Service: All</option>
            {allAvailableServices.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {(search || selectedChapter || selectedService || selectedStatus !== 'All') && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('');
              setSelectedChapter('');
              setSelectedService('');
              setSelectedStatus('All');
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="result-count" style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
        Showing {filteredMembers.length} of {visibleMembers.length} member{visibleMembers.length === 1 ? '' : 's'}
      </div>

      {/* Presentation: Desktop Table vs. Mobile Record Cards */}
      {filteredMembers.length === 0 ? (
        <EmptyView
          icon={MembersIcon}
          title="No members match criteria"
          description={search ? 'No members found matching your search keyword.' : 'No members registered in this Area yet.'}
          actionLabel="+ Add Member"
          onAction={() => {
            setActiveModalMember(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* Desktop Table (≥ 1024px) */}
          <div className="table-container desktop-only-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Chapter</th>
                  <th>Services</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.trim() || 'Youth Member';
                  const mServices = Array.isArray(m.services) ? m.services : [];
                  const isActive = (m.status || 'Active') === 'Active';
                  const chapterLabel = getChapterName(m.chapter_id || m.chapterId);

                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</div>
                        {m.email && <div className="muted" style={{ fontSize: '0.78rem' }}>{m.email}</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.86rem' }}>{m.contact_number || m.contact || '-'}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                          {chapterLabel}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {mServices.length > 0 ? (
                            mServices.map(s => (
                              <span key={s} className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                                {s}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No Service Assigned</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ marginRight: '6px' }}
                          onClick={() => setDetailMember({ ...m, chapterName: chapterLabel })}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ marginRight: '6px' }}
                          onClick={() => {
                            setActiveModalMember(m);
                            setIsModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm red"
                          onClick={() => setDeleteTarget(m)}
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

          {/* Mobile Record Cards (< 1024px) */}
          <div className="mobile-card-list">
            {filteredMembers.map((m) => {
              const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.trim() || 'Youth Member';
              const initials = `${(m.first_name || m.firstName || 'M')[0]}${(m.last_name || m.lastName || 'Y')[0]}`.toUpperCase();
              const mServices = Array.isArray(m.services) ? m.services : [];
              const isActive = (m.status || 'Active') === 'Active';
              const chapterLabel = getChapterName(m.chapter_id || m.chapterId);

              return (
                <div
                  key={m.id}
                  className="card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderRadius: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--mfc-navy)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          flexShrink: 0
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                          {name}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {chapterLabel} {mServices.length > 0 ? `• ${mServices[0]}` : ''}
                        </span>
                      </div>
                    </div>

                    <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.74rem' }}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {m.email && <div>✉ {m.email}</div>}
                    {(m.contact_number || m.contact) && <div>📞 {m.contact_number || m.contact}</div>}
                  </div>

                  {mServices.length > 1 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {mServices.slice(1).map(s => (
                        <span key={s} className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, minHeight: '44px', justifyContent: 'center' }}
                      onClick={() => setDetailMember({ ...m, chapterName: chapterLabel })}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, minHeight: '44px', justifyContent: 'center' }}
                      onClick={() => {
                        setActiveModalMember(m);
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn red"
                      style={{ minHeight: '44px', padding: '0 14px' }}
                      onClick={() => setDeleteTarget(m)}
                      aria-label={`Delete ${name}`}
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

      {/* Member Add/Edit Form Modal */}
      <MemberModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseModal) onCloseModal();
        }}
        onSave={handleSaveMember}
        member={activeModalMember}
        chapters={chapters}
      />

      {/* Member Details Drawer / View Modal */}
      <MemberDetailModal
        isOpen={!!detailMember}
        onClose={() => setDetailMember(null)}
        member={detailMember}
        gigHistory={gigHistory}
        onEdit={(m) => {
          setActiveModalMember(m);
          setIsModalOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="confirm-delete-title" style={{ fontSize: '1.15rem' }}>Confirm Member Deletion</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)' }}>
                Are you sure you want to remove <strong>{deleteTarget.first_name || deleteTarget.firstName} {deleteTarget.last_name || deleteTarget.lastName}</strong> from the Area roster?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteMember} disabled={deleting}>
                {deleting ? 'Removing...' : 'Delete Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembersView;
