import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { LoadingView, ErrorView } from '../common/StateViews';
import { ServicesIcon, MembersIcon, SyncIcon } from '../icons/Icons';

const OFFICIAL_SERVICES = [
  { name: 'Unit Servant', category: 'Leadership', description: 'Leads unit level youth pastoral households and fellowships.' },
  { name: 'Household Servant', category: 'Leadership', description: 'Pastors regular small group youth households and prayer meetings.' },
  { name: 'Chapter Servant', category: 'Leadership', description: 'Coordinates chapter activities, youth camps, and parish engagement.' },
  { name: 'Area Servant', category: 'Leadership', description: 'Oversees youth community growth and leadership across the Area.' },
  { name: 'Area LIT Servant', category: 'Specialized', description: 'Leaders-in-Training program coordinator for servant formation.' },
  { name: 'Campus Servant', category: 'Specialized', description: 'MFC Youth High School and University campus evangelization.' },
  { name: 'Area Kids Servant', category: 'Specialized', description: 'Bridges transitions from MFC Kids to MFC Youth community.' },
  { name: 'MFC High Servant', category: 'Specialized', description: 'Servants dedicated to secondary/high school youth pastoral care.' },
  { name: 'Music', category: 'Creative & Liturgical', description: 'Worship leaders, instrumentalists, and music ministry servants.' },
  { name: 'Dance', category: 'Creative & Liturgical', description: 'Liturgical and conference youth praise dance team.' },
  { name: 'Creative Writing', category: 'Media & Arts', description: 'Newsletters, event scripts, reflections, and inspirational write-ups.' },
  { name: 'Graphics & Promo', category: 'Media & Arts', description: 'Visual design, social media publicity, and conference branding.' },
  { name: 'Photography & Videography', category: 'Media & Arts', description: 'Photo coverage, event recaps, and video testimonies.' }
];

export function ServicesView() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(OFFICIAL_SERVICES[0].name);

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
      setError(err.message || 'Failed loading ministries.');
    } finally {
      setLoading(false);
    }
  };

  const assignedMembers = members.filter((m) => {
    const srv = Array.isArray(m.services) ? m.services : [];
    return srv.includes(selectedService);
  });

  const activeServiceInfo = OFFICIAL_SERVICES.find(s => s.name === selectedService) || OFFICIAL_SERVICES[0];

  if (loading) return <LoadingView message="Loading Area Ministries & Servants..." />;
  if (error && members.length === 0) return <ErrorView title="Ministries Error" error={error} onRetry={loadMembers} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem' }}>Ministries & Service Directory</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Official youth community service roles and assigned servants
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={loadMembers}>
          <SyncIcon size={14} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Ministry Selector Column */}
        <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Service Ministries ({OFFICIAL_SERVICES.length})
          </div>
          {OFFICIAL_SERVICES.map((srv) => {
            const isSelected = selectedService === srv.name;
            const count = members.filter(m => (Array.isArray(m.services) ? m.services : []).includes(srv.name)).length;

            return (
              <button
                key={srv.name}
                type="button"
                className={`nav-item ${isSelected ? 'active' : ''}`}
                style={{
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  backgroundColor: isSelected ? 'var(--mfc-blue)' : 'transparent',
                  justifyContent: 'space-between'
                }}
                onClick={() => setSelectedService(srv.name)}
              >
                <span>{srv.name}</span>
                <span
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--border-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Assigned Servants Details Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span className="badge badge-info">{activeServiceInfo.category}</span>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginTop: '4px' }}>
                  {activeServiceInfo.name}
                </h3>
              </div>
              <span className="badge badge-success">
                {assignedMembers.length} Servant{assignedMembers.length === 1 ? '' : 's'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {activeServiceInfo.description}
            </p>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Assigned Servants</h3>
            </div>

            {assignedMembers.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No servants currently assigned to {activeServiceInfo.name}.
                <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                  Assign this ministry role by editing a member's profile in the Members directory.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assignedMembers.map((m) => {
                  const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`;
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.school || m.email || ''} {m.contact_number || m.contact ? `• ${m.contact_number || m.contact}` : ''}
                        </div>
                      </div>

                      <span className="badge badge-success">
                        Active Servant
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
