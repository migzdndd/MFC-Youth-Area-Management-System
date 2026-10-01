import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardIcon,
  MembersIcon,
  ChaptersIcon,
  EventsIcon,
  ReportsIcon,
  ServicesIcon,
  ScriptureIcon,
  SettingsIcon,
  LogoutIcon
} from '../icons/Icons';

export function Sidebar({ currentView, onNavigate }) {
  const { user, role, areaName, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'members', label: 'Members', icon: MembersIcon },
    { id: 'chapters', label: 'Chapters', icon: ChaptersIcon },
    { id: 'events', label: 'Events & Attendance', icon: EventsIcon },
    { id: 'reports', label: 'Activity Reports', icon: ReportsIcon },
    { id: 'services', label: 'Ministries & Services', icon: ServicesIcon },
    { id: 'readings', label: 'Daily Readings', icon: ScriptureIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const formatRole = (r) => {
    if (!r) return 'Servant';
    return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <aside className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-header">
        <img
          src="/logo.png"
          alt="MFC Youth Logo"
          className="sidebar-logo"
        />
        <div>
          <div className="sidebar-brand-title">MFC Youth</div>
          <div className="sidebar-brand-sub">Area Management</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '8px 4px', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.email || 'Leader')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.70)' }}>
            {formatRole(role)} {areaName ? `• ${areaName}` : ''}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="nav-item"
          style={{ color: '#fca5a5', padding: '8px 12px', minHeight: '38px' }}
        >
          <LogoutIcon size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
