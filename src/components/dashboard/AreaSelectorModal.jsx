import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { XIcon, CheckIcon } from '../icons/Icons';

export function AreaSelectorModal({ isOpen, onClose }) {
  const { areaId, switchArea } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAreas();
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

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="area-select-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="area-select-title" style={{ fontSize: '1.2rem' }}>
            Switch Active Area
          </h2>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Select an Area to view and administer youth members, chapters, and event records.
          </p>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading available Areas...
            </div>
          ) : areas.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No areas configured.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
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
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
