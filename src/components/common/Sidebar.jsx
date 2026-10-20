import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAuthorizedWorkflows } from '../../constants/workflows';
import { X } from 'lucide-react';

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
        return { label: 'Area Admin', color: '#fef3c7', text: '#b45309', border: '#fcd34d' };
      case 'DOMAIN_MODERATOR':
        return { label: 'Domain Mod', color: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'CHAPTER_LEADER':
        return { label: 'Chapter Lead', color: '#d1fae5', text: '#047857', border: '#a7f3d0' };
      default:
        return { label: 'Youth Servant', color: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  const badge = getRoleBadge();

  return (
    <aside
      className={`sidebar ${isOpen ? 'open is-open' : ''}`}
      id="sidebar"
      aria-label="Main navigation"
      style={{ backgroundColor: '#002847' }}
    >
      <div className="sidebar-brand">
        <img src="/img/logo-2.png" className="sidebar-logo" alt="MFC Youth Logo" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>MFC YOUTH</h2>
          <p>AREA MANAGEMENT SYSTEM</p>
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

      {/* Servant Profile Quick Badge */}
      <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || user?.email || 'Servant Leader'}
            </span>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {areaName || 'Assigned Area'}
            </span>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.68rem',
              fontWeight: 700,
              backgroundColor: badge.color,
              color: badge.text,
              border: `1px solid ${badge.border}`,
              whiteSpace: 'nowrap'
            }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const displayLabel = isChapterServant && item.chapterServantLabel ? item.chapterServantLabel : item.label;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <img src={item.icon} className="nav-icon" alt="" aria-hidden="true" />
              <span>{displayLabel}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          className="logout-link"
          id="logoutBtn"
          type="button"
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
        >
          Logout
        </button>
        <div className="sidebar-footer">
          Powered &amp; designed by <br />
          <a href="https://migzdndd.github.io/web-portfolio/" target="_blank" rel="noopener noreferrer">migz.dev</a>
          <div style={{ marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => handleNavClick('changelogs')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: '#38bdf8',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              System Changelogs &rarr;
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

