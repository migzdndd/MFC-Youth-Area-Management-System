import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiRequest } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { useOffline } from '../../context/OfflineContext';
import { XIcon, CheckIcon, SearchIcon, SyncIcon } from '../icons/Icons';

export function parseAttendeeQr(rawText) {
  const text = String(rawText || '').trim();
  if (text.startsWith('mfc_ticket:')) {
    const parts = text.split(':');
    return { eventId: parts[1], memberId: parts[2] };
  }
  if (text.startsWith('mfc:id:')) {
    const parts = text.split(':');
    return { eventId: 'all', memberId: parts[2], checksum: parts[3] };
  }
  return null;
}

/**
 * High-Speed QR Attendance Scanner & Continuous Kiosk Engine
 * Operates with camera scanner, audio feedback, haptics, and instant offline caching.
 */
export function QrAttendanceScannerModal({
  isOpen,
  onClose,
  event,
  members = [],
  participants = [],
  onAttendanceUpdated
}) {
  const { isOnline } = useOffline();

  // Mode: 'camera' | 'manual'
  const [scanMode, setScanMode] = useState('camera');
  // Kiosk mode: continuous self-scanning without closing modal
  const [isKioskMode, setIsKioskMode] = useState(false);
  
  const [manualQuery, setManualQuery] = useState('');
  const [scanningActive, setScanningActive] = useState(false);
  const [scannerError, setScannerError] = useState(null);

  // Status feedback
  const [lastScannedMember, setLastScannedMember] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // { type: 'success' | 'warning' | 'error', text: '' }
  const [isProcessing, setIsProcessing] = useState(false);

  // Checked-in count locally maintained for real-time responsiveness
  const [checkedInIds, setCheckedInIds] = useState(new Set());

  const qrReaderRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  // Hardware wedge barcode scanner listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't intercept typing in inputs or textareas unless it looks like rapid scanner entry
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') {
        // If it's the Enter key and buffer accumulated
        if (e.key === 'Enter' && barcodeBufferRef.current.length > 3) {
          const scanned = barcodeBufferRef.current;
          barcodeBufferRef.current = '';
          handleCodeScanned(scanned);
          return;
        }
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 120) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.trim().length > 2) {
          e.preventDefault();
          const scanned = barcodeBufferRef.current.trim();
          barcodeBufferRef.current = '';
          handleCodeScanned(scanned);
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, event, members, checkedInIds]);

  // Initialize checked-in list from participants
  useEffect(() => {
    if (participants && Array.isArray(participants)) {
      const ids = new Set();
      participants.forEach(p => {
        const memId = p.member_id || p.memberId;
        if (memId && (p.attended || p.status === 'Attended')) {
          ids.add(String(memId));
        }
      });
      setCheckedInIds(ids);
    }
  }, [participants]);

  // Audio & Haptic Feedback
  const triggerFeedback = (type = 'success') => {
    // Tactile haptics
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (type === 'success') navigator.vibrate([60, 40, 80]);
        else navigator.vibrate([150, 80, 150]);
      }
    } catch {}

    // Synthesized chime
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        if (type === 'success') {
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        } else {
          osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
          osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1); // A3
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}
  };

  // Start Camera QR Scanner
  useEffect(() => {
    if (!isOpen || scanMode !== 'camera') {
      stopScanner();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setScannerError(null);
        setScanningActive(true);

        const html5QrCode = new Html5Qrcode('qr-reader-container');
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isMounted) {
              handleCodeScanned(decodedText);
            }
          },
          () => {
            // Frame parse error - ignore standard noise
          }
        );
      } catch (err) {
        if (isMounted) {
          console.warn('[QRScanner] Camera start error:', err);
          setScannerError(
            err.message?.includes('Permission')
              ? 'Camera permission was denied. Please allow camera access in your browser or device settings.'
              : 'Unable to start camera scanner. You can use manual check-in search below.'
          );
          setScanningActive(false);
        }
      }
    };

    // Small delay to ensure container element is rendered
    const timeout = setTimeout(startScanner, 150);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      stopScanner();
    };
  }, [isOpen, scanMode]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('[QRScanner] Stop notice:', e);
      }
      html5QrCodeRef.current = null;
    }
    setScanningActive(false);
  };

  // Process decoded QR or Barcode
  const handleCodeScanned = async (rawCode) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const code = String(rawCode || '').trim();
      let memberId = null;

      // 1. Dual-format QR parsing support: mfc_ticket:<eventId>:<memberId> or mfc:id:<memberId>:<checksum>
      const parsedQr = parseAttendeeQr(code);
      if (parsedQr) {
        if (parsedQr.eventId !== 'all' && event?.id && String(parsedQr.eventId) !== String(event.id)) {
          triggerFeedback('error');
          setScanStatus({
            type: 'error',
            text: `Invalid ticket: this QR pass was issued for a different event.`
          });
          resetStatusAfterDelay();
          return;
        }
        memberId = parsedQr.memberId;
      }

      // Check if JSON payload (e.g., { memberId: "...", code: "..." })
      if (!memberId && code.startsWith('{')) {
        try {
          const parsed = JSON.parse(code);
          memberId = parsed.memberId || parsed.id || parsed.member_id;
        } catch {}
      }

      // Check if format is "MFC-YOUTH-MEM-<ID>" or raw ID
      if (!memberId) {
        if (code.startsWith('MFC-YOUTH-MEM-')) {
          memberId = code.replace('MFC-YOUTH-MEM-', '');
        } else {
          memberId = code;
        }
      }

      // Find member in loaded directory
      const member = members.find(m => 
        String(m.id) === String(memberId) ||
        String(m.member_id) === String(memberId) ||
        (m.mfc_id && String(m.mfc_id).toLowerCase() === String(memberId).toLowerCase()) ||
        String(m.barcode) === String(code) ||
        String(m.contact_number || m.contact || '').replace(/\D/g, '') === code.replace(/\D/g, '')
      );

      if (!member) {
        triggerFeedback('error');
        setScanStatus({
          type: 'error',
          text: `Unknown badge "${code}". Member not found in directory.`
        });
        resetStatusAfterDelay();
        return;
      }

      await checkInMember(member);
    } catch (err) {
      triggerFeedback('error');
      setScanStatus({
        type: 'error',
        text: err.message || 'Error processing check-in.'
      });
      resetStatusAfterDelay();
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute check-in mutation with instant offline fallback
  const checkInMember = async (member) => {
    const memIdStr = String(member.id);

    // Check duplicate check-in
    if (checkedInIds.has(memIdStr)) {
      triggerFeedback('warning');
      setLastScannedMember(member);
      setScanStatus({
        type: 'warning',
        text: `${member.first_name || ''} ${member.last_name || ''} is ALREADY checked in.`
      });
      resetStatusAfterDelay();
      return;
    }

    const payload = {
      event_id: event.id,
      member_id: member.id,
      attended: true,
      status: 'Attended',
      payment_status: 'Paid',
      checked_in_at: new Date().toISOString(),
      is_offline: !isOnline
    };

    // Optimistically update local checked-in set
    setCheckedInIds(prev => new Set([...prev, memIdStr]));
    setLastScannedMember(member);

    try {
      const res = await apiRequest('/api/participants', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      triggerFeedback('success');
      const offlineNotice = res?.offline ? ' (Saved Offline — queued for sync)' : '';
      setScanStatus({
        type: 'success',
        text: `Checked in ${member.first_name || ''} ${member.last_name || ''}${offlineNotice}!`
      });

      if (onAttendanceUpdated) {
        onAttendanceUpdated();
      }
    } catch (err) {
      console.warn('[CheckIn] Network error, enqueuing locally:', err);
      // Fallback: manually enqueue to offline mutation store
      await offlineStore.enqueueMutation({
        endpoint: '/api/participants',
        method: 'POST',
        payload
      });

      triggerFeedback('success');
      setScanStatus({
        type: 'success',
        text: `Checked in ${member.first_name || ''} ${member.last_name || ''} (Saved to offline outbox)!`
      });

      if (onAttendanceUpdated) {
        onAttendanceUpdated();
      }
    } finally {
      resetStatusAfterDelay();
    }
  };

  const resetStatusAfterDelay = () => {
    setTimeout(() => {
      isProcessingRef.current = false;
      if (!isKioskMode) {
        setScanStatus(null);
      }
    }, isKioskMode ? 2200 : 1500);
  };

  // Filter members for manual fallback search
  const manualFilteredMembers = members.filter(m => {
    if (!manualQuery.trim()) return false;
    const q = manualQuery.toLowerCase();
    const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
    const contact = (m.contact_number || m.contact || '').toLowerCase();
    return fullName.includes(q) || contact.includes(q);
  }).slice(0, 10);

  if (!isOpen || !event) return null;

  const totalAttendees = checkedInIds.size;
  const eventName = event.name || event.title || 'Event Attendance';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="qr-scanner-title" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#002847',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
              {isKioskMode ? '⚡ KIOSK AUTO-CHECK-IN' : 'ATTENDANCE SCANNER'}
            </span>
            <h2 id="qr-scanner-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#ffffff' }}>
              {eventName}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={onClose}
            aria-label="Close scanner"
            style={{ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none' }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Real-Time Live Attendance Counter Banner */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--bg-subtle, #f8fafc)',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#10b981' : '#f59e0b'
              }}
            />
            <span style={{ color: 'var(--text-muted)' }}>
              {isOnline ? 'Cloud Synced' : 'Offline Mode (Local Cache)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#002847' }}>{totalAttendees}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>Checked-in</span>
            </div>

            {/* Kiosk Mode Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
              <input
                type="checkbox"
                checked={isKioskMode}
                onChange={e => setIsKioskMode(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: isKioskMode ? 700 : 500, color: isKioskMode ? '#0284c7' : 'inherit' }}>
                Kiosk Mode
              </span>
            </label>
          </div>
        </div>

        {/* Scan Mode Tabs (Camera vs Manual Search) */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: scanMode === 'camera' ? '#ffffff' : 'var(--bg-subtle, #f8fafc)',
              color: scanMode === 'camera' ? '#002847' : 'var(--text-muted)',
              fontWeight: scanMode === 'camera' ? 700 : 500,
              borderBottom: scanMode === 'camera' ? '2px solid #002847' : 'none',
              cursor: 'pointer'
            }}
          >
            📷 Camera Scanner
          </button>
          <button
            type="button"
            onClick={() => setScanMode('manual')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: scanMode === 'manual' ? '#ffffff' : 'var(--bg-subtle, #f8fafc)',
              color: scanMode === 'manual' ? '#002847' : 'var(--text-muted)',
              fontWeight: scanMode === 'manual' ? 700 : 500,
              borderBottom: scanMode === 'manual' ? '2px solid #002847' : 'none',
              cursor: 'pointer'
            }}
          >
            🔍 Manual Check-In
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Scan Result Feedback Banner */}
          {scanStatus && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor:
                  scanStatus.type === 'success'
                    ? '#ecfdf5'
                    : scanStatus.type === 'warning'
                    ? '#fffbeb'
                    : '#fef2f2',
                color:
                  scanStatus.type === 'success'
                    ? '#047857'
                    : scanStatus.type === 'warning'
                    ? '#b45309'
                    : '#b91c1c',
                border: `1.5px solid ${
                  scanStatus.type === 'success'
                    ? '#6ee7b7'
                    : scanStatus.type === 'warning'
                    ? '#fde68a'
                    : '#fca5a5'
                }`,
                fontSize: '0.88rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              {scanStatus.type === 'success' ? (
                <CheckIcon size={20} />
              ) : (
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              )}
              <span>{scanStatus.text}</span>
            </div>
          )}

          {/* Mode 1: Camera Scanner */}
          {scanMode === 'camera' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div
                id="qr-reader-container"
                ref={qrReaderRef}
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#0f172a',
                  minHeight: '260px',
                  position: 'relative'
                }}
              />

              {scannerError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    textAlign: 'center'
                  }}
                >
                  {scannerError}
                </div>
              )}

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                Hold member QR badge or phone screen steady in front of the camera lens.
              </p>
            </div>
          )}

          {/* Mode 2: Manual Check-In Fallback Search */}
          {scanMode === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search member by first or last name..."
                  className="form-input"
                  style={{ width: '100%', minHeight: '44px', paddingLeft: '38px' }}
                  value={manualQuery}
                  onChange={e => setManualQuery(e.target.value)}
                  autoFocus
                />
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>
                  <SearchIcon size={18} />
                </span>
              </div>

              {manualQuery.trim() && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {manualFilteredMembers.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No youth members found matching "{manualQuery}".
                    </div>
                  ) : (
                    manualFilteredMembers.map(m => {
                      const isAlreadyCheckedIn = checkedInIds.has(String(m.id));
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            backgroundColor: isAlreadyCheckedIn ? '#f1f5f9' : '#ffffff',
                            border: '1px solid var(--border-subtle, #e2e8f0)',
                            borderRadius: '8px'
                          }}
                        >
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#002847' }}>
                              {m.first_name} {m.last_name}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {m.chapter_name || m.school || m.category || 'MFC Youth'}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`btn ${isAlreadyCheckedIn ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => checkInMember(m)}
                            disabled={isAlreadyCheckedIn || isProcessing}
                            style={{ minHeight: '36px', fontSize: '0.8rem', padding: '6px 12px' }}
                          >
                            {isAlreadyCheckedIn ? '✓ Attended' : 'Check In'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Last Checked In Member Profile Card */}
          {lastScannedMember && (
            <div
              style={{
                marginTop: 'auto',
                padding: '12px 14px',
                backgroundColor: 'rgba(2, 132, 199, 0.05)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#002847',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}
              >
                {(lastScannedMember.first_name?.[0] || 'M') + (lastScannedMember.last_name?.[0] || 'Y')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Latest Verified Badge
                </span>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#002847', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lastScannedMember.first_name} {lastScannedMember.last_name}
                </strong>
              </div>
              <span
                style={{
                  padding: '3px 8px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                VERIFIED
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
