import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAuthorizedWorkflows } from '../../constants/workflows';

export function Sidebar({ currentView, onNavigate, isOpen = false, onClose }) {
  const { role, logout } = useAuth();

  const isChapterServant = role === 'chapter_servant';
  const navItems = getAuthorizedWorkflows(role);

  const handleNavClick = (id) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  return (
    <aside
      className={`sidebar ${isOpen ? 'open is-open' : ''}`}
      id="sidebar"
      aria-label="Main navigation"
    >
      <div className="sidebar-brand">
        <img src="/img/logo-2.png" className="sidebar-logo" alt="MFC Youth Logo" />
        <div>
          <h2>MFC YOUTH</h2>
          <p>AREA MANAGEMENT SYSTEM</p>
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

