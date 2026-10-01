import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { EventModal } from './EventModal';
import { EventDetailModal } from './EventDetailModal';
import { ParticipantModal } from './ParticipantModal';
import { LoadingView, EmptyView, ErrorView } from '../common/StateViews';
import {
  EventsIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  SyncIcon
} from '../icons/Icons';

export function EventsView({ modalOpen, onCloseModal }) {
  const { session } = useAuth();
  const role = session?.role || 'member';
  const isChapterServant = role === 'chapter_servant';
  const isAreaAdmin = !isChapterServant && role !== 'member';

  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [timing, setTiming] = useState('All');

  // Modals state
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [selectedViewEvent, setSelectedViewEvent] = useState(null);

  const [activeParticipant, setActiveParticipant] = useState(null);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (modalOpen && isAreaAdmin) {
      setActiveModalEvent(null);
      setIsEventModalOpen(true);
    }
  }, [modalOpen, isAreaAdmin]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, participantsRes, membersRes] = await Promise.all([
        apiRequest('/api/events'),
        apiRequest('/api/participants'),
        apiRequest('/api/members')
      ]);

      if (eventsRes?.ok) {
        setEvents(eventsRes.events || []);
      }
      if (participantsRes?.ok) {
        setParticipants(participantsRes.participants || []);
      }
      if (membersRes?.ok) {
        setMembers(membersRes.members || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load events data.');
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
        if (selectedViewEvent?.id === data.id) {
          setSelectedViewEvent(prev => ({ ...prev, ...data }));
        }
      } else {
        const newObj = {
          ...data,
          id: res.id || `evt_${Date.now()}`
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
      setParticipants(prev => prev.filter(p => String(p.eventId || p.event_id) !== String(deleteTarget.id)));
      if (selectedViewEvent?.id === deleteTarget.id) {
        setSelectedViewEvent(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete event: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveParticipant = async (data) => {
    const isEdit = !!data.id;
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await apiRequest('/api/participants', {
      method,
      body: JSON.stringify(data)
    });

    if (res?.ok) {
      if (isEdit) {
        setParticipants(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
      } else {
        const newPart = {
          ...data,
          id: res.participant?.id || res.id || `part_${Date.now()}`
        };
        setParticipants(prev => [newPart, ...prev]);
      }
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    if (!window.confirm('Remove this participant from the event?')) return;
    try {
      await apiRequest(`/api/participants?id=${encodeURIComponent(participantId)}`, {
        method: 'DELETE'
      });
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    } catch (err) {
      alert(`Could not delete participant: ${err.message}`);
    }
  };

  // Helper date formatting
  const fmtDateTime = (val) => {
    if (!val) return '-';
    const d = new Date(val);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
  };

  // Filter and sort events
  const now = Date.now();
  const filteredEvents = events.filter(event => {
    const name = event.name || event.title || '';
    const venue = event.venue || event.location || '';
    const desc = event.description || '';
    const match = `${name} ${venue} ${desc}`.toLowerCase().includes(search.toLowerCase());
    if (!match) return false;

    const eventDateStr = event.date || event.event_date || '';
    const time = new Date(eventDateStr).getTime();
    if (timing === 'Upcoming' && time < now) return false;
    if (timing === 'Past' && time >= now) return false;

    return true;
  }).sort((a, b) => {
    const aTime = new Date(a.date || a.event_date || 0).getTime();
    const bTime = new Date(b.date || b.event_date || 0).getTime();
    return timing === 'Upcoming' ? aTime - bTime : bTime - aTime;
  });

  const getEventParticipants = (eventId) => {
    return participants.filter(p => String(p.eventId || p.event_id) === String(eventId));
  };

  const getAttendedCount = (event) => {
    const eventParts = getEventParticipants(event.id);
    const attended = eventParts.filter(p => p.attended || p.status === 'Attended').length;
    return eventParts.length ? attended : Number(event.peopleAttended || 0);
  };

  if (loading) return <LoadingView message="Loading Area Youth Events..." />;
  if (error && events.length === 0) return <ErrorView title="Events Error" error={error} onRetry={loadAllData} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Events</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {isAreaAdmin
              ? 'Manage Area events, participant registration, payment status, and attendance.'
              : 'View Area events. Chapter Servants have read-only event access.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadAllData}>
            <SyncIcon size={14} />
            Refresh
          </button>
          {isAreaAdmin ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setActiveModalEvent(null);
                setIsEventModalOpen(true);
              }}
              style={{ minHeight: '44px' }}
            >
              <PlusIcon size={16} />
              + Add Event
            </button>
          ) : (
            <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              View Only
            </span>
          )}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="search"
            className="search-input"
            style={{ width: '100%', paddingLeft: '36px', minHeight: '44px' }}
            placeholder="Search events or venues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select-input compact-filter"
          value={timing}
          onChange={e => setTiming(e.target.value)}
          style={{ minHeight: '44px', minWidth: '120px' }}
        >
          <option value="All">All</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Past">Past</option>
        </select>

        {(search || timing !== 'All') && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearch('');
              setTiming('All');
            }}
            style={{ minHeight: '44px' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Result Count */}
      <div className="result-count" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Showing {filteredEvents.length} of {events.length} event{events.length === 1 ? '' : 's'}
      </div>

      {/* Content Table / Cards */}
      {filteredEvents.length === 0 ? (
        <EmptyView
          icon={EventsIcon}
          title="No matching events"
          description={events.length ? 'Change or clear the event filters.' : 'Add your first Area event.'}
          actionLabel={isAreaAdmin ? '+ Add Event' : undefined}
          onAction={isAreaAdmin ? () => {
            setActiveModalEvent(null);
            setIsEventModalOpen(true);
          } : undefined}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="card table-wrap desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date & Time</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Event</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Venue</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Fee</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Registered</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Attended</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => {
                  const eventParts = getEventParticipants(event.id);
                  const isUpcoming = new Date(event.date || event.event_date || 0).getTime() >= now;
                  const fee = parseFloat(event.fee ?? event.registration_fee ?? 0);
                  const eventName = event.name || event.title;

                  return (
                    <tr key={event.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem' }}>
                        {fmtDateTime(event.date || event.event_date)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {eventName}
                        </strong>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {event.venue || event.location || '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${isUpcoming ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.75rem' }}>
                          {isUpcoming ? 'Upcoming' : 'Completed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem' }}>
                        {fee > 0 ? `₱${fee}` : 'Free'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {eventParts.length}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--mfc-blue)' }}>
                        {getAttendedCount(event)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedViewEvent(event)}
                          >
                            View
                          </button>
                          {isAreaAdmin && (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setActiveModalEvent(event);
                                  setIsEventModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeleteTarget(event)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="mobile-only mobile-card-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredEvents.map(event => {
              const eventParts = getEventParticipants(event.id);
              const isUpcoming = new Date(event.date || event.event_date || 0).getTime() >= now;
              const fee = parseFloat(event.fee ?? event.registration_fee ?? 0);
              const eventName = event.name || event.title;

              return (
                <div key={event.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                        {eventName}
                      </strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📅 {fmtDateTime(event.date || event.event_date)}
                      </div>
                    </div>
                    <span className={`badge ${isUpcoming ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.75rem' }}>
                      {isUpcoming ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>📍 {event.venue || event.location || 'No venue specified'}</div>
                    <span className="badge badge-info">{fee > 0 ? `₱${fee}` : 'Free'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', padding: '8px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                    <div>Registered: <strong>{eventParts.length}</strong></div>
                    <div>Attended: <strong>{getAttendedCount(event)}</strong></div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, minHeight: '44px' }}
                      onClick={() => setSelectedViewEvent(event)}
                    >
                      View Details
                    </button>
                    {isAreaAdmin && (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                          title="Edit Event"
                          aria-label={`Edit ${eventName}`}
                          onClick={() => {
                            setActiveModalEvent(event);
                            setIsEventModalOpen(true);
                          }}
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-icon"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                          title="Delete Event"
                          aria-label={`Delete ${eventName}`}
                          onClick={() => setDeleteTarget(event)}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          if (onCloseModal) onCloseModal();
        }}
        onSave={handleSaveEvent}
        event={activeModalEvent}
      />

      {/* Event Details View Modal */}
      <EventDetailModal
        isOpen={!!selectedViewEvent}
        onClose={() => setSelectedViewEvent(null)}
        event={selectedViewEvent}
        participants={selectedViewEvent ? getEventParticipants(selectedViewEvent.id) : []}
        members={members}
        isAreaAdmin={isAreaAdmin}
        onRegisterParticipant={() => {
          setActiveParticipant(null);
          setIsParticipantModalOpen(true);
        }}
        onEditParticipant={(p) => {
          setActiveParticipant(p);
          setIsParticipantModalOpen(true);
        }}
        onDeleteParticipant={handleDeleteParticipant}
      />

      {/* Participant Modal */}
      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
        onSave={handleSaveParticipant}
        participant={activeParticipant}
        eventId={selectedViewEvent?.id}
        members={members}
        existingParticipants={selectedViewEvent ? getEventParticipants(selectedViewEvent.id) : []}
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
                Are you sure you want to delete event <strong>{deleteTarget.name || deleteTarget.title}</strong> and all associated participant records?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ minHeight: '44px' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteEvent} disabled={deleting} style={{ minHeight: '44px' }}>
                {deleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
