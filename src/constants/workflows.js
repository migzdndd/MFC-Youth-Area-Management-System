/**
 * Central Workflow & Route Configuration
 * Unifies all application workflow branches, role authorizations, and navigation routing.
 */

export const AUTH_WORKFLOWS = {
  LOGIN: 'login',
  REGISTER: 'register',
  CLAIM: 'claim',
  FORGOT_PASSWORD: 'forgot-password',
  CHANGELOGS: 'changelogs'
};

export const LEADERSHIP_WORKFLOWS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    mobileLabel: 'Home',
    title: 'Area Dashboard',
    icon: '/Icons/dashboard.png',
    category: 'core',
    mobilePrimary: true,
    hideForChapterServant: false
  },
  {
    id: 'members',
    label: 'Members',
    title: 'Members Directory',
    icon: '/Icons/members.png',
    category: 'operations',
    mobilePrimary: true,
    hideForChapterServant: true
  },
  {
    id: 'chapters',
    label: 'Chapters',
    chapterServantLabel: 'Chapter',
    title: 'Chapters & Units',
    icon: '/Icons/chapters.png',
    category: 'operations',
    mobilePrimary: false,
    hideForChapterServant: false
  },
  {
    id: 'services',
    label: 'Services',
    title: 'Creative Ministries & Services',
    icon: '/Icons/services.png',
    category: 'community',
    mobilePrimary: false,
    hideForChapterServant: true
  },
  {
    id: 'reports',
    label: 'Activity Reports',
    mobileLabel: 'Reports',
    title: 'Activity Reports',
    icon: '/Icons/reports.png',
    category: 'operations',
    mobilePrimary: true,
    hideForChapterServant: false
  },
  {
    id: 'events',
    label: 'Events',
    title: 'Events & Attendance',
    icon: '/Icons/events.png',
    category: 'operations',
    mobilePrimary: true,
    hideForChapterServant: false
  },
  {
    id: 'gig',
    label: 'GIG Stewardship',
    title: 'GIG Stewardship & Tithes',
    icon: '/Icons/reports.png',
    category: 'community',
    mobilePrimary: false,
    hideForChapterServant: false
  },
  {
    id: 'readings',
    label: 'Daily Scripture',
    title: 'Daily Liturgical Scripture',
    icon: '/Icons/dashboard.png',
    category: 'community',
    mobilePrimary: false,
    hideForChapterServant: false
  },
  {
    id: 'settings',
    label: 'Settings & Security',
    title: 'Settings & Security',
    icon: '/Icons/services.png',
    category: 'system',
    mobilePrimary: false,
    hideForChapterServant: false
  },
  {
    id: 'changelogs',
    label: 'System Changelogs',
    title: 'System Transparency & Guide',
    icon: '/Icons/reports.png',
    category: 'system',
    mobilePrimary: false,
    hideForChapterServant: false,
    isFooterLink: true
  }
];

const WORKFLOW_MAP = new Map(LEADERSHIP_WORKFLOWS.map(w => [w.id, w]));

export function getWorkflowTitle(workflowId, defaultTitle = 'MFC Youth AMS') {
  const item = WORKFLOW_MAP.get(workflowId);
  return item?.title || defaultTitle;
}

export function getAuthorizedWorkflows(role = '') {
  const isChapterServant = String(role).toLowerCase() === 'chapter_servant';
  return LEADERSHIP_WORKFLOWS.filter(item => {
    if (item.isFooterLink) return false;
    if (isChapterServant && item.hideForChapterServant) return false;
    return true;
  });
}

export function getMobilePrimaryWorkflows(role = '') {
  const isChapterServant = String(role).toLowerCase() === 'chapter_servant';
  return LEADERSHIP_WORKFLOWS.filter(item => {
    if (item.isFooterLink) return false;
    if (isChapterServant && item.hideForChapterServant) return false;
    // For Chapter Servant, show chapter in bottom bar if members is hidden
    if (isChapterServant && item.id === 'chapters') return true;
    return item.mobilePrimary;
  });
}

export function isValidLeadershipRoute(routeId) {
  return WORKFLOW_MAP.has(routeId);
}

export function isValidAuthRoute(routeId) {
  return Object.values(AUTH_WORKFLOWS).includes(routeId);
}
