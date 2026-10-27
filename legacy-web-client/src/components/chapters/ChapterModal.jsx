import React, { useState, useEffect } from 'react';
import { XIcon } from '../icons/Icons';

export function ChapterModal({ isOpen, onClose, onSave, chapter }) {
  const [name, setName] = useState('');
  const [servantName, setServantName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (chapter) {
      setName(chapter.name || chapter.chapter_name || '');
      setServantName(chapter.servant_name || chapter.servantName || '');
    } else {
      setName('');
      setServantName('');
    }
    setError('');
  }, [chapter, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Chapter name is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSave({
        id: chapter?.id,
        name: name.trim(),
        servant_name: servantName.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save chapter.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="chapter-modal-title" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="chapter-modal-title" style={{ fontSize: '1.2rem' }}>
            {chapter ? 'Edit Chapter' : 'Create New Chapter'}
          </h2>
          <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)', marginBottom: '16px', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="chapterName">Chapter Name *</label>
              <input
                id="chapterName"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Chapter 1 - St. Joseph Parish"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="servantName">Chapter Servant Leader Name</label>
              <input
                id="servantName"
                type="text"
                className="form-input"
                placeholder="e.g. Bro. John Doe"
                value={servantName}
                onChange={e => setServantName(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : chapter ? 'Update Chapter' : 'Create Chapter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
