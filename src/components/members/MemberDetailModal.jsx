import React from 'react';
import { XIcon, EditIcon } from '../icons/Icons';

export function MemberDetailModal({ isOpen, onClose, member, onEdit, gigHistory = [] }) {
  if (!isOpen || !member) return null;

  const fullName = `${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`.trim() || 'Member Details';
  const chapterName = member.chapterName || member.chapter_name || 'No Chapter Assigned';
  const status = member.status || 'Active';
  const services = Array.isArray(member.services) ? member.services.filter(Boolean) : [];

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amt || 0);
  };

  const age = calculateAge(member.birth_date || member.birthDate);
  const memberGig = gigHistory.filter(g => String(g.member_id || g.memberId) === String(member.id));
  const totalGig = memberGig.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="member-detail-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2 id="member-detail-title" style={{ fontSize: '1.28rem', margin: 0, color: 'var(--text-main)' }}>
              {fullName}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              {chapterName} • <span className={`badge ${status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>{status}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onEdit && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onEdit(member);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <EditIcon size={14} />
                Edit
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Body with 5 Subheading Sections */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {/* Section 1: Personal Details */}
          <div>
            <h3 style={{ fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mfc-blue)', margin: '0 0 10px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
              Personal Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '0.86rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>First Name</span>
                <strong>{member.first_name || member.firstName || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Middle Name</span>
                <strong>{member.middle_name || member.middleName || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Last Name</span>
                <strong>{member.last_name || member.lastName || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Nickname</span>
                <strong>{member.nickname ? `"${member.nickname}"` : '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Gender</span>
                <strong>{member.gender || 'Not specified'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Current Age</span>
                <strong>{age !== null ? `${age} years old` : '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Birth Date</span>
                <strong>{formatDate(member.birth_date || member.birthDate)}</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div>
            <h3 style={{ fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mfc-blue)', margin: '0 0 10px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.86rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Contact Number</span>
                <strong>{member.contact_number || member.contact || 'None provided'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Email Address</span>
                <strong>{member.email ? <a href={`mailto:${member.email}`} style={{ color: 'var(--mfc-blue)' }}>{member.email}</a> : 'None provided'}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Residential Address</span>
                <strong>{member.address || 'No residential address on record'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Emergency Contact</span>
                <strong>{member.emergency_contact_person || member.emergencyContactPerson || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Emergency Number</span>
                <strong>{member.emergency_contact_number || member.emergencyContactNumber || '-'}</strong>
              </div>
            </div>
          </div>

          {/* Section 3: Pastoral Information */}
          <div>
            <h3 style={{ fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mfc-blue)', margin: '0 0 10px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
              Pastoral Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.86rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>First Attended Youth Camp</span>
                <strong>{formatDate(member.first_attended_youth_camp || member.firstAttendedYouthCamp)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Household Head</span>
                <strong>{member.household_head || member.householdHead || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>System Access Level</span>
                <strong style={{ textTransform: 'capitalize' }}>{(member.access_level || member.accessLevel || 'member').replace('_', ' ')}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem' }}>Academic Affiliation</span>
                <strong>{member.school || 'Not specified'} {member.academic_track ? `(${member.academic_track})` : ''}</strong>
              </div>
            </div>
          </div>

          {/* Section 4: Assigned Services */}
          <div>
            <h3 style={{ fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mfc-blue)', margin: '0 0 10px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
              Assigned Services
            </h3>
            {services.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {services.map((srv) => (
                  <span key={srv} className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    {srv}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                No specific ministry services assigned yet.
              </p>
            )}
          </div>

          {/* Section 5: GIG Giving History */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', margin: '0 0 10px 0' }}>
              <h3 style={{ fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--mfc-blue)', margin: 0 }}>
                GIG Giving History
              </h3>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-success)' }}>
                Total: {formatCurrency(totalGig)}
              </span>
            </div>
            {memberGig.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {memberGig.map((g, idx) => (
                  <div key={g.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-secondary)', fontSize: '0.84rem' }}>
                    <div>
                      <strong>{formatDate(g.contribution_date || g.date)}</strong>
                      {g.notes && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{g.notes}</div>}
                    </div>
                    <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(parseFloat(g.amount))}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                No GIG tithes or contributions recorded for this member.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
