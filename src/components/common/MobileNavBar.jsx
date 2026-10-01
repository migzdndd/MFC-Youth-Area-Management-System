import React from 'react';
import {
  DashboardIcon,
  MembersIcon,
  EventsIcon,
  GigIcon,
  ReportsIcon,
  SettingsIcon
} from '../icons/Icons';

export function MobileNavBar({ currentView, onNavigate }) {
  const items = [
    { id: 'dashboard', label: 'Home', icon: DashboardIcon },
    { id: 'members', label: 'Members', icon: MembersIcon },
    { id: 'events', label: 'Events', icon: EventsIcon },
    { id: 'gig', label: 'GIG', icon: GigIcon },
    { id: 'reports', label: 'Reports', icon: ReportsIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  return (
    <nav className="mobile-nav-bar" aria-label="Mobile Navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
