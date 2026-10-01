import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingView, ErrorView } from '../common/StateViews';
import { SyncIcon, XIcon } from '../icons/Icons';

export function ServicesView() {
  const { role } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Service Members Modal State
  const [activeServiceModal, setActiveServiceModal] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/api/members');
      if (res?.ok) {
        setMembers(res.members || []);
      }
    } catch (err) {
      setError(err.message || 'Failed loading service rosters.');
    } finally {
      setLoading(false);
    }
  };

  // Role-tailored headers
  let pageTitle = 'Service Directory';
  let pageSubtitle = 'Manage ministry roles and member assignments.';

  if (role === 'lit_servant') {
    pageTitle = 'LIT Creative Ministries';
    pageSubtitle = 'Music, Dance, Creative Writing, Graphics & Promo, and Photography & Videography.';
  } else if (role === 'campus_servant') {
    pageTitle = 'Campus Ministry Directory';
    pageSubtitle = 'Campus youth members, coordinators, and schools.';
  } else if (role === 'area_kids_servant') {
    pageTitle = 'MFC Kids Service Directory';
    pageSubtitle = 'MFC Kids ministry servant assignments.';
  }

  // Core Creative Ministries + Roles
  const serviceCards = [
    { id: 'Music', title: 'Music', description: 'Worship leaders, instrumentalists, and music ministry servants.' },
    { id: 'Dance', title: 'Dance', description: 'Liturgical and conference youth praise dance team.' },
    { id: 'Creative Writing', title: 'Creative Writing', description: 'Newsletters, event scripts, reflections, and inspirational write-ups.' },
    { id: 'Graphics & Promo', title: 'Graphics & Promo', description: 'Visual design, social media publicity, and conference branding.' },
    { id: 'Photography & Videography', title: 'Photography & Videography', description: 'Photo coverage, event recaps, and video testimonies.' }
  ];

  const getServiceMembers = (serviceId) => {
    return members.filter(m => {
      const srvList = Array.isArray(m.services) ? m.services : [];
      return srvList.includes(serviceId);
    });
  };

  const handleRemoveAssignment = async (memberId, serviceName) => {
    if (!confirm(`Remove "${serviceName}" assignment from this member?`)) return;

    setRemovingId(memberId);
    try {
      const target = members.find(m => String(m.id) === String(memberId));
      if (!target) return;

      const currentServices = Array.isArray(target.services) ? target.services : [];
      const updatedServices = currentServices.filter(s => s !== serviceName);

      const res = await apiRequest('/api/members', {
        method: 'PATCH',
        body: JSON.stringify({
          id: memberId,
          services: updatedServices
        })
      });

      if (res?.ok) {
        setMembers(prev =>
          prev.map(m => (m.id === memberId ? { ...m, services: updatedServices } : m))
        );
      }
    } catch (err) {
      alert(`Could not remove assignment: ${err.message}`);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <LoadingView message="Loading Area Ministries & Servants..." />;
  if (error && members.length === 0) return <ErrorView title="Ministries Error" error={error} onRetry={loadMembers} />;

  const modalMembers = activeServiceModal ? getServiceMembers(activeServiceModal.id) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Role-Tailored Header (H1) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
            {pageTitle}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
            {pageSubtitle}
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={loadMembers}>
          <SyncIcon size={14} />
          Refresh
        </button>
      </div>

      {/* Service Cards Grid */}
      <div className="service-grid">
        {serviceCards.map((service) => {
          const assignedList = getServiceMembers(service.id);
          const count = assignedList.length;

          return (
            <section className="card service-card" key={service.id}>
              <h3>{service.title}</h3>
              <div className="count">{count}</div>
              <p>{count === 1 ? '1 Assigned member' : `${count} Assigned members`}</p>
              <button
                className="btn"
                type="button"
                onClick={() => setActiveServiceModal(service)}
                style={{ width: '100%', minHeight: '44px', justifyContent: 'center' }}
              >
                View Members
              </button>
            </section>
          );
        })}
      </div>

      {/* Service Members Modal */}
      {activeServiceModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          onClick={() => setActiveServiceModal(null)}
        >
          <div className="modal-content" style={{ maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="service-modal-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                {activeServiceModal.title} Members
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setActiveServiceModal(null)}
                aria-label="Close dialog"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {modalMembers.length > 0 ? (
                <div className="mini-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {modalMembers.map((m) => {
                    const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.trim() || 'Youth Member';
                    const isRemoving = removingId === m.id;

                    return (
                      <div
                        key={m.id}
                        className="mini-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <strong>{name}</strong>
                          <div className="muted" style={{ fontSize: '0.78rem' }}>
                            {m.chapterName || m.chapter_name || 'No Chapter'}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn red btn-sm"
                          disabled={isRemoving}
                          onClick={() => handleRemoveAssignment(m.id, activeServiceModal.id)}
                          style={{ fontSize: '0.76rem', minHeight: '36px' }}
                        >
                          {isRemoving ? 'Removing...' : 'Remove assignment'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No members assigned to {activeServiceModal.title} yet.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveServiceModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServicesView;
