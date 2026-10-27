import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { XIcon, CheckIcon } from '../icons/Icons';

export function AreaSelectorModal({ isOpen, onClose }) {
  const { areaId, switchArea, createArea, role } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAreas();
      setShowCreate(false);
      setNewAreaName('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const loadAreas = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/areas');
      if (res?.ok && Array.isArray(res.areas)) {
        setAreas(res.areas);
      }
    } catch (err) {
      console.warn('[AreaSelector] Error loading areas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSelectArea = async (area) => {
    await switchArea(area.id, area.name || area.area_name);
    onClose();
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    const clean = newAreaName.trim();
    if (clean.length < 3) {
      setErrorMsg('Area name must be at least 3 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const res = await createArea(clean);
    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to create Area.');
      setSubmitting(false);
    } else {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="area-select-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="area-select-title" style={{ fontSize: '1.2rem' }}>
            {showCreate ? 'Create Area Database' : 'Select or Switch Area'}
          </h2>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger-border)',
              marginBottom: '14px',
              fontSize: '0.85rem'
            }}>
              {errorMsg}
            </div>
          )}

          {!showCreate ? (
            <>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Select an Area to view and administer youth members, chapters, and event records.
              </p>

              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading available Areas...
                </div>
              ) : areas.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No Area records found. Click below to create your Area database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {areas.map(a => {
                    const isSelected = a.id === areaId;
                    const name = a.name || a.area_name;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleSelectArea(a)}
                        className="nav-item"
                        style={{
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? 'var(--color-info-bg)' : 'var(--bg-surface-secondary)',
                          color: 'var(--text-main)',
                          border: `1px solid ${isSelected ? 'var(--mfc-blue)' : 'var(--border-subtle)'}`,
                          padding: '12px 16px'
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 700 : 500 }}>{name}</span>
                        {isSelected && <CheckIcon size={18} className="text-blue" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreate(true)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Create New Area Database
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateArea}>
              <div className="form-group">
                <label className="form-label" htmlFor="modalNewAreaInput">
                  Area Name
                </label>
                <input
                  id="modalNewAreaInput"
                  type="text"
                  className="form-input"
                  placeholder="e.g. MFC Youth NCR East"
                  maxLength={120}
                  value={newAreaName}
                  onChange={e => setNewAreaName(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Creates the Area in Supabase, connects your account, and initializes service rosters.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreate(false)}
                  disabled={submitting}
                >
                  Back to List
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || newAreaName.trim().length < 3}
                >
                  {submitting ? 'Creating...' : 'Create Area'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
