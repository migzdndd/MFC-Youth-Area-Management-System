import React, { useState, useEffect } from 'react';
import { XIcon } from '../icons/Icons';

const SERVICES_LIST = [
  'Unit Servant',
  'Household Servant',
  'Chapter Servant',
  'Area Servant',
  'Area LIT Servant',
  'Campus Servant',
  'Area Kids Servant',
  'MFC High Servant',
  'Music',
  'Dance',
  'Creative Writing',
  'Graphics & Promo',
  'Photography & Videography'
];

export function MemberModal({ isOpen, onClose, onSave, member, chapters = [] }) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '',
    gender: 'Male',
    category: 'Youth',
    email: '',
    contact: '',
    birthDate: '',
    school: '',
    academicTrack: '',
    gradeLevel: '',
    address: '',
    householdHead: '',
    emergencyContactPerson: '',
    emergencyContactNumber: '',
    chapterId: '',
    accessLevel: 'member',
    status: 'Active',
    services: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || member.first_name || '',
        middleName: member.middleName || member.middle_name || '',
        lastName: member.lastName || member.last_name || '',
        nickname: member.nickname || '',
        gender: member.gender || 'Male',
        category: member.category || (String(member.ministry_branch || '').toLowerCase().includes('kid') ? 'Kids' : 'Youth'),
        email: member.email || '',
        contact: member.contact || member.contact_number || '',
        birthDate: member.birthDate || member.birth_date || '',
        school: member.school || '',
        academicTrack: member.academicTrack || member.academic_track || '',
        gradeLevel: member.gradeLevel || member.grade_level || '',
        address: member.address || '',
        householdHead: member.householdHead || member.household_head || '',
        emergencyContactPerson: member.emergencyContactPerson || member.emergency_contact_person || '',
        emergencyContactNumber: member.emergencyContactNumber || member.emergency_contact_number || '',
        chapterId: member.chapterId || member.chapter_id || '',
        accessLevel: member.accessLevel || member.access_level || 'member',
        status: member.status || 'Active',
        services: Array.isArray(member.services) ? member.services : []
      });
    } else {
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        nickname: '',
        gender: 'Male',
        category: 'Youth',
        email: '',
        contact: '',
        birthDate: '',
        school: '',
        academicTrack: '',
        gradeLevel: '',
        address: '',
        householdHead: '',
        emergencyContactPerson: '',
        emergencyContactNumber: '',
        chapterId: chapters[0]?.id || '',
        accessLevel: 'member',
        status: 'Active',
        services: []
      });
    }
    setError('');
  }, [member, chapters, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (srv) => {
    setFormData(prev => {
      const exists = prev.services.includes(srv);
      return {
        ...prev,
        services: exists ? prev.services.filter(s => s !== srv) : [...prev.services, srv]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First and Last name are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSave({
        ...formData,
        id: member?.id
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="member-modal-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="member-modal-title" style={{ fontSize: '1.2rem' }}>
            {member ? 'Edit Member Profile' : 'Register New Member'}
          </h2>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)', marginBottom: '16px', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            {/* Category / Branch & Chapter Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="category">Ministry Category *</label>
                <select
                  id="category"
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Youth">MFC Youth (Ages 13-21)</option>
                  <option value="Kids">MFC Kids (Ages 4-12)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="chapterId">Chapter</label>
                <select
                  id="chapterId"
                  name="chapterId"
                  className="form-select"
                  value={formData.chapterId}
                  onChange={handleChange}
                >
                  <option value="">No Chapter (Unassigned)</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.chapter_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="middleName">Middle Name</label>
                <input
                  id="middleName"
                  name="middleName"
                  type="text"
                  className="form-input"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nickname">Nickname</label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Migz"
                  value={formData.nickname}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male (Brother)</option>
                  <option value="Female">Female (Sister)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="birthDate">Birth Date</label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  className="form-input"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="status">Membership Status</label>
                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact">Contact Number</label>
                <input
                  id="contact"
                  name="contact"
                  type="tel"
                  className="form-input"
                  placeholder="09123456789"
                  value={formData.contact}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">Residential Address</label>
              <input
                id="address"
                name="address"
                type="text"
                className="form-input"
                placeholder="House No., Street, Barangay, City/Municipality"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* Pastoral & Emergency Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="householdHead">Household Head / Servant</label>
                <input
                  id="householdHead"
                  name="householdHead"
                  type="text"
                  className="form-input"
                  placeholder="Name of Household Head"
                  value={formData.householdHead}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="emergencyContactPerson">Emergency Contact Person</label>
                <input
                  id="emergencyContactPerson"
                  name="emergencyContactPerson"
                  type="text"
                  className="form-input"
                  placeholder="Parent / Guardian Name"
                  value={formData.emergencyContactPerson}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emergencyContactNumber">Emergency Contact Number</label>
              <input
                id="emergencyContactNumber"
                name="emergencyContactNumber"
                type="tel"
                className="form-input"
                placeholder="09123456789"
                value={formData.emergencyContactNumber}
                onChange={handleChange}
              />
            </div>

            {/* Academic Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="school">School / University</label>
                <input
                  id="school"
                  name="school"
                  type="text"
                  className="form-input"
                  value={formData.school}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gradeLevel">Grade / Year Level</label>
                <input
                  id="gradeLevel"
                  name="gradeLevel"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Grade 11 / 2nd Year"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Ministry / Service Assignments */}
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label className="form-label">Ministry / Service Roles</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {SERVICES_LIST.map((srv) => {
                  const checked = formData.services.includes(srv);
                  return (
                    <button
                      type="button"
                      key={srv}
                      onClick={() => handleServiceToggle(srv)}
                      className={`btn btn-sm ${checked ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.8rem', minHeight: '34px' }}
                    >
                      {checked ? '✓ ' : '+ '} {srv}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : member ? 'Update Member' : 'Register Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
