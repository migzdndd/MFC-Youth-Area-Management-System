import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMobilePrimaryWorkflows } from '../../constants/workflows';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Sparkles, 
  FileText, 
  Calendar, 
  BookOpen 
} from 'lucide-react';

const WORKFLOW_LUCIDE_ICONS = {
  dashboard: LayoutDashboard,
  members: Users,
  chapters: Building2,
  services: Sparkles,
  reports: FileText,
  events: Calendar,
  readings: BookOpen
};

export function MobileNavBar({ currentView, onNavigate }) {
  const { role } = useAuth();
  const isChapterServant = role === 'chapter_servant';
  const primaryWorkflows = getMobilePrimaryWorkflows(role);

  const handleTap = (viewId) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onNavigate(viewId);
  };

  return (
    <nav className="bottom-nav" aria-label="Mobile primary navigation">
      <div className="bottom-nav-inner">
        {primaryWorkflows.map((item) => {
          const isActive = currentView === item.id;
          const label = item.mobileLabel || (isChapterServant && item.chapterServantLabel ? item.chapterServantLabel : item.label);
          const IconComponent = WORKFLOW_LUCIDE_ICONS[item.id] || LayoutDashboard;

          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleTap(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav-icon-wrap">
                <IconComponent size={20} className="bottom-nav-icon" />
              </div>
              <span className="bottom-nav-label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
