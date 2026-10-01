import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../services/api';
import { MemberModal } from './MemberModal';
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
  const [members, setMembers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [categorySegment, setCategorySegment] = useState('ALL'); // 'ALL' | 'YOUTH' | 'KIDS'

  const [activeModalMember, setActiveModalMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      const [membersRes, chaptersRes] = await Promise.all([
        apiRequest('/api/members'),
        apiRequest('/api/chapters')
      ]);

      if (membersRes?.ok) {
        setMembers(membersRes.members || []);
      }
      if (chaptersRes?.ok) {
        setChapters(chaptersRes.chapters || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load member roster.');
    } finally {
      setLoading(false);
    }
  };

  const getMemberCategory = (m) => {
    const raw = String(m.category || m.ministry_branch || '').toLowerCase();
    if (raw.includes('kid')) return 'KIDS';
    if (raw.includes('youth')) return 'YOUTH';
    if (m.birth_date || m.birthDate) {
      const bYear = new Date(m.birth_date || m.birthDate).getFullYear();
      const age = new Date().getFullYear() - bYear;
      if (age < 13) return 'KIDS';
      return 'YOUTH';
    }
    return 'YOUTH';
  };

  const youthCount = useMemo(() => {
    return members.filter(m => getMemberCategory(m) === 'YOUTH').length;
  }, [members]);

  const kidsCount = useMemo(() => {
    return members.filter(m => getMemberCategory(m) === 'KIDS').length;
  }, [members]);

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
      category: formData.category,
      ministry_branch: formData.category,
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
      // Optimistic local update
      if (isEdit) {
        setMembers(prev => prev.map(m => m.id === formData.id ? { ...m, ...payload, firstName: formData.firstName, lastName: formData.lastName } : m));
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

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const fullName = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.toLowerCase();
      const email = (m.email || '').toLowerCase();
      const school = (m.school || '').toLowerCase();
      const term = search.toLowerCase().trim();

      const matchesSearch = !term || fullName.includes(term) || email.includes(term) || school.includes(term);

      const mChapterId = m.chapter_id || m.chapterId || '';
      const matchesChapter = !selectedChapter || mChapterId === selectedChapter;

      const mServices = Array.isArray(m.services) ? m.services : [];
      const matchesService = !selectedService || mServices.includes(selectedService);

      const mStatus = m.status || 'Active';
      const matchesStatus = selectedStatus === 'All' || mStatus === selectedStatus;

      const cat = getMemberCategory(m);
      const matchesCategory = categorySegment === 'ALL' || cat === categorySegment;

      return matchesSearch && matchesChapter && matchesService && matchesStatus && matchesCategory;
    });
  }, [members, search, selectedChapter, selectedService, selectedStatus, categorySegment]);

  const getChapterName = (chapterId) => {
    if (!chapterId) return 'Unassigned';
    const c = chapters.find(ch => ch.id === chapterId);
    return c?.name || c?.chapter_name || 'Unassigned';
  };

  if (loading) return <LoadingView message="Loading Area Youth Member Roster..." />;
  if (error && members.length === 0) return <ErrorView title="Members Roster Error" error={error} onRetry={loadData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem' }}>Youth Members Directory</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Total {filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'} displayed
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
            Register Member
          </button>
        </div>
      </div>

      {/* Category Segmented Tabs (Youth vs Kids) */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className={`btn btn-sm ${categorySegment === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '38px', padding: '6px 14px' }}
          onClick={() => setCategorySegment('ALL')}
        >
          All Members ({members.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${categorySegment === 'YOUTH' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '38px', padding: '6px 14px' }}
          onClick={() => setCategorySegment('YOUTH')}
        >
          MFC Youth (13–21) ({youthCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${categorySegment === 'KIDS' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '38px', padding: '6px 14px' }}
          onClick={() => setCategorySegment('KIDS')}
        >
          MFC Kids (4–12) ({kidsCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <SearchIcon size={16} />
          </span>
          <input
            type="search"
            placeholder="Search by name, email, school..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search members"
          />
        </div>

        <div>
          <select
            className="form-select"
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            aria-label="Filter by chapter"
          >
            <option value="">All Chapters</option>
            {chapters.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.chapter_name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by membership status"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <EmptyView
          icon={MembersIcon}
          title="No members match criteria"
          description={search ? 'No members found matching your search keyword.' : 'No members registered in this Area yet.'}
          actionLabel="Register First Member"
          onAction={() => {
            setActiveModalMember(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Chapter</th>
                <th>Ministry Roles</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => {
                const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`;
                const mServices = Array.isArray(m.services) ? m.services : [];
                const isActive = (m.status || 'Active') === 'Active';
                const cat = getMemberCategory(m);

                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</span>
                        {m.nickname && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>"{m.nickname}"</span>
                        )}
                        <span className={`badge ${cat === 'KIDS' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          {cat === 'KIDS' ? 'MFC Kids' : 'MFC Youth'}
                        </span>
                      </div>
                      {m.school && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.school}</div>}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}>
                        {getChapterName(m.chapter_id || m.chapterId)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {mServices.length > 0 ? (
                          mServices.slice(0, 2).map(s => (
                            <span key={s} className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Youth Member</span>
                        )}
                        {mServices.length > 2 && (
                          <span className="badge" style={{ fontSize: '0.72rem' }}>+{mServices.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{m.contact_number || m.contact || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email || ''}</div>
                    </td>
                    <td>
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ width: '36px', height: '36px', padding: '6px', marginRight: '6px' }}
                        title="Edit Member"
                        aria-label={`Edit ${name}`}
                        onClick={() => {
                          setActiveModalMember(m);
                          setIsModalOpen(true);
                        }}
                      >
                        <EditIcon size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ width: '36px', height: '36px', padding: '6px', color: 'var(--color-danger)' }}
                        title="Delete Member"
                        aria-label={`Delete ${name}`}
                        onClick={() => setDeleteTarget(m)}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Modal for Add/Edit */}
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
