import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAuthorizedWorkflows } from '../../constants/workflows';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  FileText,
  Coins,
  Sparkles,
  BookOpen,
  Settings,
  History,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ExternalLink
} from 'lucide-react';

const WORKFLOW_ICONS = {
  dashboard: LayoutDashboard,
  members: Users,
  chapters: Building2,
  events: Calendar,
  reports: FileText,
  gig: Coins,
  services: Sparkles,
  readings: BookOpen,
  settings: Settings,
  changelogs: History
};

const CATEGORY_HEADERS = {
  core: 'Mission Operations',
  operations: 'Mission Operations',
  community: 'Pastoral & Care',
  system: 'Administration'
};

export function Sidebar({ currentView, onNavigate, isOpen = false, onClose }) {
  const { user, role, roleTier, areaName, logout } = useAuth();

  const isChapterServant = role === 'chapter_servant';
  const navItems = getAuthorizedWorkflows(role);

  const handleNavClick = (id) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  const getRoleBadge = () => {
    switch (roleTier) {
      case 'AREA_ADMIN':
        return { label: 'Area Admin', bg: 'rgba(255, 183, 3, 0.16)', text: '#ffb703', border: 'rgba(255, 183, 3, 0.35)' };
      case 'DOMAIN_MODERATOR':
        return { label: 'Domain Mod', bg: 'rgba(0, 168, 232, 0.16)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' };
      case 'CHAPTER_LEADER':
        return { label: 'Chapter Lead', bg: 'rgba(34, 197, 94, 0.16)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.35)' };
      default:
        return { label: 'Youth Servant', bg: 'rgba(148, 163, 184, 0.16)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const badge = getRoleBadge();
  const userName = user?.user_metadata?.first_name || user?.name || user?.email?.split('@')[0] || 'Servant Leader';
  const userInitials = (userName || 'SL').slice(0, 2).toUpperCase();

  // Group items by category for cleaner desktop IA
  const missionItems = navItems.filter(i => ['core', 'operations'].includes(i.category));
  const pastoralItems = navItems.filter(i => i.category === 'community');
  const systemItems = navItems.filter(i => i.category === 'system');

  const renderNavGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="sidebar-nav-group" key={title}>
        <div className="sidebar-nav-group-title">{title}</div>
        {items.map((item) => {
          const isActive = currentView === item.id;
          const displayLabel = isChapterServant && item.chapterServantLabel ? item.chapterServantLabel : item.label;
          const IconComponent = WORKFLOW_ICONS[item.id] || LayoutDashboard;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon-wrapper">
                <IconComponent size={18} className="nav-icon-svg" />
              </div>
              <span className="nav-label-text">{displayLabel}</span>
              {isActive && <ChevronRight size={14} className="nav-active-arrow" />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      className={`sidebar modern-sidebar ${isOpen ? 'open is-open' : ''}`}
      id="sidebar"
      aria-label="Main navigation"
    >
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-left">
          <img src="/logo.png" className="sidebar-logo" alt="MFC Youth Flame" />
          <div className="sidebar-brand-text">
            <h2>MFC YOUTH</h2>
            <p>AREA MANAGEMENT SYSTEM</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation drawer"
            title="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Servant Profile Identity Card */}
      <div className="sidebar-servant-card">
        <div className="servant-avatar" aria-hidden="true">
          {userInitials}
        </div>
        <div className="servant-meta">
          <div className="servant-name-row">
            <span className="servant-name" title={userName}>{userName}</span>
            <span
              className="servant-badge"
              style={{
                backgroundColor: badge.bg,
                color: badge.text,
                border: `1px solid ${badge.border}`
              }}
            >
              {badge.label}
            </span>
          </div>
          <span className="servant-area" title={areaName || 'Assigned Area'}>
            {areaName || 'Assigned Area'}
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {renderNavGroup('Mission Operations', missionItems)}
        {renderNavGroup('Pastoral & Care', pastoralItems)}
        {renderNavGroup('Administration', systemItems)}
      </nav>

      {/* Sidebar Footer & Logout */}
      <div className="sidebar-bottom">
        <button
          className="logout-link modern-logout-btn"
          id="logoutBtn"
          type="button"
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
        <div className="sidebar-footer">
          <span>MFC Youth AMS v1.0.1</span>
          <button
            type="button"
            onClick={() => handleNavClick('changelogs')}
            className="sidebar-changelog-btn"
          >
            System Changelogs &rarr;
          </button>
        </div>
      </div>
    </aside>
  );
}


