import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { XIcon, CheckIcon } from '../icons/Icons';

export function AssignMembersModal({ isOpen, onClose, chapter, onAssigned }) {
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && chapter) {
      loadMembers();
    }
  }, [isOpen, chapter]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/members');
      if (res?.ok) {
        const list = res.members || [];
        setMembers(list);
        // Pre-select members already in this chapter
        const existing = new Set(
          list
            .filter(m => (m.chapter_id || m.chapterId) === chapter.id)
            .map(m => m.id)
        );
        setSelectedIds(existing);
      }
    } catch (err) {
      console.warn('[AssignMembers] Failed loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !chapter) return null;

  const toggleMember = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest('/api/chapters/assign-members', {
        method: 'POST',
        body: JSON.stringify({
          chapterId: chapter.id,
          memberIds: Array.from(selectedIds)
        })
      });
      if (onAssigned) onAssigned();
      onClose();
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = members.filter(m => {
    const fullName = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`.toLowerCase();
    return !search || fullName.includes(search.toLowerCase());
  });

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="assign-modal-title" style={{ fontSize: '1.15rem' }}>
              Assign Members to Chapter
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--mfc-blue)', fontWeight: 600 }}>
              {chapter.name || chapter.chapter_name}
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <input
            type="search"
            placeholder="Search member name..."
            className="form-input"
            style={{ marginBottom: '12px' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Selected {selectedIds.size} member{selectedIds.size === 1 ? '' : 's'}
          </div>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading member roster...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
              {filtered.map(m => {
                const name = `${m.first_name || m.firstName || ''} ${m.last_name || m.lastName || ''}`;
                const isSelected = selectedIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--color-info-bg)' : 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {m.school || m.email || 'Youth Member'}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: `2px solid ${isSelected ? 'var(--mfc-blue)' : 'var(--border-strong)'}`,
                        backgroundColor: isSelected ? 'var(--mfc-blue)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}
                    >
                      {isSelected && <CheckIcon size={16} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Updating...' : `Save Assignments (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
