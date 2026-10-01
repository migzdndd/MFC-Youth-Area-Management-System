import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { EventModal } from './EventModal';
import { AttendanceTrackerModal } from './AttendanceTrackerModal';
import { LoadingView, EmptyView, ErrorView } from '../common/StateViews';
import {
  EventsIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  MembersIcon,
  SyncIcon
} from '../icons/Icons';

export function EventsView({ modalOpen, onCloseModal }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackerEvent, setTrackerEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setActiveModalEvent(null);
      setIsModalOpen(true);
    }
  }, [modalOpen]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/api/events');
      if (res?.ok) {
        setEvents(res.events || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (data) => {
    const isEdit = !!data.id;
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await apiRequest('/api/events', {
      method,
      body: JSON.stringify(data)
    });

    if (res?.ok) {
      if (isEdit) {
        setEvents(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
      } else {
        const newObj = {
          ...data,
          id: res.id || `local_evt_${Date.now()}`
        };
        setEvents(prev => [newObj, ...prev]);
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/events?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE'
      });
      setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete event: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingView message="Loading Area Youth Events..." />;
  if (error && events.length === 0) return <ErrorView title="Events Error" error={error} onRetry={loadEvents} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem' }}>Youth Events & Assemblies</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Schedule area conferences, youth camps, and track live attendance
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadEvents}>
            <SyncIcon size={14} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setActiveModalEvent(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon size={16} />
            Schedule Event
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyView
          icon={EventsIcon}
          title="No events scheduled yet"
          description="Schedule an upcoming Youth Camp, Teaching Night, or Assembly for your area."
          actionLabel="Schedule First Event"
          onAction={() => {
            setActiveModalEvent(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {events.map((evt) => {
            const dateStr = evt.event_date || evt.eventDate || '';
            const fee = parseFloat(evt.fee ?? evt.registration_fee ?? 0);

            return (
              <div key={evt.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-info">
                      {evt.event_type || evt.eventType || 'Event'}
                    </span>
                    {fee > 0 ? (
                      <span className="badge badge-warning">₱{fee}</span>
                    ) : (
                      <span className="badge badge-success">Free</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                    {evt.title || evt.name}
                  </h3>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                    <div>📅 {dateStr} {evt.event_time ? `• ${evt.event_time}` : ''}</div>
                    {evt.location && <div>📍 {evt.location}</div>}
                    {evt.description && (
                      <p style={{ marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setTrackerEvent(evt)}
                    style={{ fontSize: '0.82rem' }}
                  >
                    <MembersIcon size={14} />
                    Track Attendance
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ width: '34px', height: '34px', padding: '6px' }}
                      title="Edit Event"
                      aria-label={`Edit ${evt.title || evt.name}`}
                      onClick={() => {
                        setActiveModalEvent(evt);
                        setIsModalOpen(true);
                      }}
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ width: '34px', height: '34px', padding: '6px', color: 'var(--color-danger)' }}
                      title="Delete Event"
                      aria-label={`Delete ${evt.title || evt.name}`}
                      onClick={() => setDeleteTarget(evt)}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Add/Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseModal) onCloseModal();
        }}
        onSave={handleSaveEvent}
        event={activeModalEvent}
      />

      {/* Live Attendance Tracker Modal */}
      <AttendanceTrackerModal
        isOpen={!!trackerEvent}
        onClose={() => setTrackerEvent(null)}
        event={trackerEvent}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-evt-title" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="confirm-delete-evt-title" style={{ fontSize: '1.15rem' }}>Confirm Event Deletion</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)' }}>
                Are you sure you want to remove event <strong>{deleteTarget.title || deleteTarget.name}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteEvent} disabled={deleting}>
                {deleting ? 'Removing...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
