import React, { useState } from 'react';
import { XIcon } from '../icons/Icons';

/**
 * Universal Member Digital ID & Event Pass Generator
 * Generates both:
 * - Universal Member Pass: mfc:id:<member_id>:<checksum> or mfc_ticket:all:<member_id>
 * - Event-Specific Ticket: mfc_ticket:<event_id>:<member_id>
 */
export function DigitalIdPass({ isOpen, onClose, member, events = [] }) {
  const [passMode, setPassMode] = useState('universal'); // 'universal' | 'event'
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');

  if (!isOpen || !member) return null;

  const memberId = member.id || member.member_id || 'guest';
  const memberName = `${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`.trim() || 'Youth Member';
  const chapterName = member.chapter_name || member.chapterName || 'MFC Youth Area';
  const mfcCode = member.mfc_id || `MFC-${String(memberId).slice(0, 8).toUpperCase()}`;

  // Simple checksum for universal format
  const checksum = String(memberId).split('').reduce((acc, char) => (acc + char.charCodeAt(0)) % 1000, 777);

  // Generate QR Code value
  const qrValue = passMode === 'event' && selectedEventId
    ? `mfc_ticket:${selectedEventId}:${memberId}`
    : `mfc_ticket:all:${memberId}`;

  const legacyQrValue = `mfc:id:${memberId}:${checksum}`;

  // Use a reliable SVG QR generator service or fallback URL
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrValue)}&format=svg`;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="digital-pass-title" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '420px',
          width: '95%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Pass Top Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #002847 0%, #0369a1 100%)',
            color: '#ffffff',
            padding: '20px 20px 16px',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={onClose}
            aria-label="Close pass"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              color: '#ffffff',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none'
            }}
          >
            <XIcon size={16} />
          </button>

          <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8' }}>
            OFFICIAL DIGITAL ACCESS PASS
          </span>
          <h2 id="digital-pass-title" style={{ fontSize: '1.25rem', margin: '4px 0 2px', fontWeight: 800, color: '#ffffff' }}>
            {memberName}
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
            {chapterName} · {mfcCode}
          </span>
        </div>

        {/* Pass Mode Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => setPassMode('universal')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: passMode === 'universal' ? '#ffffff' : 'transparent',
              color: passMode === 'universal' ? '#002847' : '#64748b',
              fontWeight: passMode === 'universal' ? 700 : 500,
              fontSize: '0.82rem',
              borderBottom: passMode === 'universal' ? '2px solid #002847' : 'none',
              cursor: 'pointer'
            }}
          >
            Universal Pass
          </button>
          <button
            type="button"
            onClick={() => setPassMode('event')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: passMode === 'event' ? '#ffffff' : 'transparent',
              color: passMode === 'event' ? '#002847' : '#64748b',
              fontWeight: passMode === 'event' ? 700 : 500,
              fontSize: '0.82rem',
              borderBottom: passMode === 'event' ? '2px solid #002847' : 'none',
              cursor: 'pointer'
            }}
          >
            Event Ticket
          </button>
        </div>

        {/* QR Code Card Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {passMode === 'event' && (
            <div style={{ width: '100%' }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                Select Event for Ticket:
              </label>
              <select
                className="form-input"
                style={{ width: '100%', minHeight: '38px', fontSize: '0.85rem' }}
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
              >
                {events.length === 0 ? (
                  <option value="">No events scheduled</option>
                ) : (
                  events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name || ev.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* QR Display */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '2px dashed #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
          >
            <img
              src={qrImageSrc}
              alt="Member Attendance QR Pass"
              style={{ width: '190px', height: '190px', display: 'block' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px', fontFamily: 'monospace' }}>
              {qrValue}
            </span>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', margin: 0 }}>
            Present this QR code at the event entrance kiosk or registration table for instant check-in.
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} style={{ minHeight: '36px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
