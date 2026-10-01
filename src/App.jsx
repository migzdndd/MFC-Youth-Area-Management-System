import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileNavBar } from './components/common/MobileNavBar';
import { OfflineBanner } from './components/common/OfflineBanner';
import { SyncCenterModal } from './components/common/SyncCenterModal';
import { MfaVerifyModal } from './components/auth/MfaVerifyModal';
import { AreaSelectorModal } from './components/dashboard/AreaSelectorModal';
import { AreaOnboardingModal } from './components/auth/AreaOnboardingModal';

import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { ClaimAccountView } from './components/auth/ClaimAccountView';

import { DashboardView } from './components/dashboard/DashboardView';
import { MembersView } from './components/members/MembersView';
import { ChaptersView } from './components/chapters/ChaptersView';
import { EventsView } from './components/events/EventsView';
import { ReportsView } from './components/reports/ReportsView';
import { ServicesView } from './components/services/ServicesView';
import { ReadingsView } from './components/readings/ReadingsView';
import { SettingsView } from './components/settings/SettingsView';
import { GigView } from './components/gig/GigView';
import { ChangelogView } from './components/changelogs/ChangelogView';
import { MemberPortalView } from './components/member/MemberPortalView';

export function AppContent() {
  const { isAuthenticated, loading, role, needsAreaSetup } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'claim'
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAreaSelectorOpen, setIsAreaSelectorOpen] = useState(false);

  // Quick Action triggers from Dashboard
  const [triggerNewMember, setTriggerNewMember] = useState(false);
  const [triggerNewEvent, setTriggerNewEvent] = useState(false);
  const [triggerNewReport, setTriggerNewReport] = useState(false);
  const [triggerNewGig, setTriggerNewGig] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in -> Show Auth Screens
  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' && <LoginView onSwitchView={setAuthView} />}
        {authView === 'register' && <RegisterView onSwitchView={setAuthView} />}
        {authView === 'claim' && <ClaimAccountView onSwitchView={setAuthView} />}
        <MfaVerifyModal />
      </>
    );
  }

  // Self-Service Member Portal Role
  if (role === 'member') {
    return (
      <>
        <MemberPortalView />
        <MfaVerifyModal />
      </>
    );
  }

  const viewTitles = {
    dashboard: 'Area Dashboard',
    members: 'Members Directory',
    chapters: 'Chapters & Units',
    events: 'Events & Attendance',
    gig: 'GIG Stewardship & Tithes',
    reports: 'Activity Reports',
    services: 'Ministries & Services',
    readings: 'Daily Liturgical Scripture',
    changelogs: 'System Transparency & Guide',
    settings: 'Settings & Security'
  };

  const canSwitchArea = role === 'national_coordinator' || role === 'couple_coordinator';
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Mobile Top App Bar */}
      <div className="mobile-topbar">
        <strong>MFC Youth AMS</strong>
        <button
          id="menuBtn"
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setIsMobileDrawerOpen(prev => !prev)}
        >
          Menu
        </button>
      </div>

      {/* Backdrop Scrim for Mobile Sidebar Drawer */}
      <div
        className={`sidebar-scrim ${isMobileDrawerOpen ? 'show' : ''}`}
        aria-hidden="true"
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      {/* Navigation Sidebar (Persistent on Desktop, Slide-over Drawer on Mobile) */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsMobileDrawerOpen(false);
        }}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      <div className="main-content">
        {/* Offline & Sync Status Banner */}
        <OfflineBanner />

        {/* Global Top Navbar */}
        <Navbar
          title={viewTitles[currentView] || 'MFC Youth AMS'}
          onOpenAreaSelector={() => setIsAreaSelectorOpen(true)}
          canSelectArea={canSwitchArea}
        />

        {/* Page Content View Router */}
        <main className="page-wrapper" id="main-content">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentView}
              onOpenNewMember={() => {
                setCurrentView('members');
                setTriggerNewMember(true);
              }}
              onOpenNewEvent={() => {
                setCurrentView('events');
                setTriggerNewEvent(true);
              }}
              onOpenNewReport={() => {
                setCurrentView('reports');
                setTriggerNewReport(true);
              }}
              onOpenNewGig={() => {
                setCurrentView('gig');
                setTriggerNewGig(true);
              }}
            />
          )}

          {currentView === 'members' && (
            <MembersView
              modalOpen={triggerNewMember}
              onCloseModal={() => setTriggerNewMember(false)}
            />
          )}

          {currentView === 'chapters' && (
            <ChaptersView />
          )}

          {currentView === 'events' && (
            <EventsView
              modalOpen={triggerNewEvent}
              onCloseModal={() => setTriggerNewEvent(false)}
            />
          )}

          {currentView === 'gig' && (
            <GigView
              modalOpen={triggerNewGig}
              onCloseModal={() => setTriggerNewGig(false)}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              modalOpen={triggerNewReport}
              onCloseModal={() => setTriggerNewReport(false)}
            />
          )}

          {currentView === 'services' && (
            <ServicesView />
          )}

          {currentView === 'readings' && (
            <ReadingsView />
          )}

          {currentView === 'changelogs' && (
            <ChangelogView />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>

        {/* Mobile View Bottom Navigation Bar */}
        <MobileNavBar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setIsMobileDrawerOpen(false);
          }}
        />
      </div>

      {/* Global Modals */}
      {needsAreaSetup && <AreaOnboardingModal />}
      <SyncCenterModal />
      <AreaSelectorModal
        isOpen={isAreaSelectorOpen}
        onClose={() => setIsAreaSelectorOpen(false)}
      />
      <MfaVerifyModal />
    </div>
  );
}

export default AppContent;
