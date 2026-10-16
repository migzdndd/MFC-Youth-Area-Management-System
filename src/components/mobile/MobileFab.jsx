import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  QrCode, 
  UserPlus, 
  CalendarPlus, 
  FileText, 
  Music 
} from 'lucide-react';

export function MobileFab({ onTriggerAction }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsOpen(prev => !prev);
  };

  const handleAction = (actionId, targetRoute) => {
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    setIsOpen(false);
    onTriggerAction(actionId, targetRoute);
  };

  const fabActions = [
    {
      id: 'qr-scan',
      label: 'Fast Attendance QR Scan',
      icon: QrCode,
      target: 'events',
      color: '#0878bd'
    },
    {
      id: 'create-member',
      label: 'Register Youth Member',
      icon: UserPlus,
      target: 'members',
      color: '#16a34a'
    },
    {
      id: 'create-event',
      label: 'Schedule New Event',
      icon: CalendarPlus,
      target: 'events',
      color: '#0284c7'
    },
    {
      id: 'create-report',
      label: 'Submit Activity Report',
      icon: FileText,
      target: 'reports',
      color: '#d97706'
    },
    {
      id: 'create-gig',
      label: 'Request Music/Tech Gig',
      icon: Music,
      target: 'gig',
      color: '#7c3aed'
    }
  ];

  return (
    <>
      {/* Background Scrim when Speed-Dial is open */}
      <div 
        className={`fab-scrim ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Speed Dial Menu Container */}
      <div className="mobile-fab-container">
        {isOpen && (
          <div className="fab-speed-dial" role="menu" aria-label="Quick Actions">
            {fabActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  className="fab-speed-item"
                  onClick={() => handleAction(action.id, action.target)}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="fab-item-label">{action.label}</span>
                  <span className="fab-item-icon" style={{ backgroundColor: action.color }}>
                    <Icon size={18} color="#fff" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Floating Trigger Button */}
        <button
          type="button"
          className={`mobile-fab-btn ${isOpen ? 'open' : ''}`}
          onClick={toggleOpen}
          aria-label={isOpen ? 'Close quick actions menu' : 'Open quick actions menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Plus size={26} />}
        </button>
      </div>
    </>
  );
}
