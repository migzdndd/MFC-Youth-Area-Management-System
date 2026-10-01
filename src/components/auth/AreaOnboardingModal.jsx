import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { CheckIcon } from '../icons/Icons';

export function AreaOnboardingModal() {
  const { session, role, selectArea, createArea, logout } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    setLoadingAreas(true);
    try {
      let list = [];
      try {
        const res = await apiRequest('/api/areas');
        list = Array.isArray(res?.areas) ? res.areas : [];
      } catch (apiErr) {
        console.warn('[AreaOnboarding] API areas fetch notice:', apiErr);
      }

      if (list.length === 0) {
        try {
          const supUrl = import.meta.env.VITE_SUPABASE_URL || 'https://desmhxtmnmfybrsdwhwz.supabase.co';
          const supKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rUW_5JS39kngwMT6bY5b4w_Se_Lo3eT';
          const headers = { 'apikey': supKey };
          if (session?.accessToken) {
            headers['Authorization'] = `Bearer ${session.accessToken}`;
          }
          const sRes = await fetch(`${supUrl}/rest/v1/areas?select=id,name,code`, { headers });
          if (sRes.ok) {
            const raw = await sRes.json();
            if (Array.isArray(raw)) list = raw;
          }
        } catch (supErr) {
          console.warn('[AreaOnboarding] Supabase direct areas notice:', supErr);
        }
      }

      setAreas(list);
      if (list.length > 0) {
        setSelectedAreaId(list[0].id);
      }
    } catch (err) {
      console.warn('[AreaOnboarding] Error loading areas:', err);
      setMessage({
        type: 'error',
        text: 'Unable to retrieve existing Areas from the server. You can create a new Area below.'
      });
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleSelectArea = async (e) => {
    e.preventDefault();
    if (!selectedAreaId) {
      setMessage({ type: 'error', text: 'Please select an Area before continuing.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const res = await selectArea(selectedAreaId);
    if (!res.ok) {
      setMessage({ type: 'error', text: res.error || 'Failed to connect to the selected Area.' });
      setSubmitting(false);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    const clean = newAreaName.trim();
    if (clean.length < 3) {
      setMessage({ type: 'error', text: 'Area Name must be at least 3 characters long.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const res = await createArea(clean);
    if (!res.ok) {
      setMessage({ type: 'error', text: res.error || 'Failed to create Area.' });
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        backgroundColor: 'rgba(0, 18, 36, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="area-onboarding-title"
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-secondary)'
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--mfc-blue)',
              marginBottom: '4px'
            }}
          >
            Account Setup
          </div>
          <h2
            id="area-onboarding-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0
            }}
          >
            Select Your MFC Youth Area
          </h2>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--text-muted)',
              marginTop: '6px',
              marginBottom: 0,
              lineHeight: 1.45
            }}
          >
            Your Servant Leader account was created successfully. Before entering the management system, connect it to the Area you serve.
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              backgroundColor: message.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
              color: message.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
              border: `1px solid ${message.type === 'error' ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`
            }}
          >
            {message.text}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {!showCreate ? (
            /* Option 1: Existing Area Selection */
            <form onSubmit={handleSelectArea} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="onboardingAreaSelect">
                  Existing Area
                </label>
                {loadingAreas ? (
                  <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Loading available Areas...
                  </div>
                ) : areas.length === 0 ? (
                  <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No Area records exist yet. Please create your Area below.
                  </div>
                ) : (
                  <select
                    id="onboardingAreaSelect"
                    className="form-input"
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    disabled={submitting}
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.area_name || a.code}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || loadingAreas || areas.length === 0}
                style={{ width: '100%', minHeight: '44px', justifyContent: 'center' }}
              >
                {submitting ? 'Connecting...' : 'Continue with Selected Area'}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '4px 0',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem'
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
                <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreate(true);
                  setMessage(null);
                }}
                disabled={submitting}
                style={{ width: '100%', minHeight: '44px', justifyContent: 'center' }}
              >
                Create Area-Based Account
              </button>
            </form>
          ) : (
            /* Option 2: Create New Area */
            <form onSubmit={handleCreateArea} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="newAreaNameInput">
                  Area Name
                </label>
                <input
                  id="newAreaNameInput"
                  type="text"
                  className="form-input"
                  placeholder="e.g. MFC Youth NCR East"
                  maxLength={120}
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                  The backend will create the Area in Supabase and connect this account to it. Standard service records will also be prepared for the new Area.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreate(false);
                    setMessage(null);
                  }}
                  disabled={submitting}
                  style={{ minHeight: '44px', justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || newAreaName.trim().length < 3}
                  style={{ minHeight: '44px', justifyContent: 'center' }}
                >
                  {submitting ? 'Creating Area...' : 'Create Area'}
                </button>
              </div>
            </form>
          )}

          {role === 'chapter_servant' && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '16px', marginBottom: 0, textAlign: 'center' }}>
              Chapter Servant accounts will still need a Chapter assignment inside this Area before chapter-scoped tools become available.
            </p>
          )}

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={logout}
              style={{ fontSize: '0.8rem' }}
            >
              Sign out of this session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
