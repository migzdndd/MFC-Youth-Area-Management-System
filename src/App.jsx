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
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLoadingWireframe } from './components/common/StateViews';
import {
  AUTH_WORKFLOWS,
  getWorkflowTitle,
  isValidLeadershipRoute
} from './constants/workflows';

export function AppContent() {
  const { isAuthenticated, loading, role, needsAreaSetup } = useAuth();
  const [authView, setAuthView] = useState(AUTH_WORKFLOWS.LOGIN);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAreaSelectorOpen, setIsAreaSelectorOpen] = useState(false);

  // Active workflow action state dispatched across views
  const [activeWorkflowAction, setActiveWorkflowAction] = useState(null);

  const handleOpenAction = (action, targetRoute) => {
    setCurrentView(targetRoute);
    setActiveWorkflowAction(action);
  };

  const handleClearAction = () => {
    setActiveWorkflowAction(null);
  };

  if (loading) {
    return <AppLoadingWireframe />;
  }

  // Auth flow branches with fallbacks
  if (!isAuthenticated) {
    let authContent = <LoginView onSwitchView={setAuthView} />;
    if (authView === AUTH_WORKFLOWS.REGISTER) {
      authContent = <RegisterView onSwitchView={setAuthView} />;
    } else if (authView === AUTH_WORKFLOWS.CLAIM) {
      authContent = <ClaimAccountView onSwitchView={setAuthView} />;
    } else if (authView === AUTH_WORKFLOWS.FORGOT_PASSWORD) {
      authContent = <ForgotPasswordView onSwitchView={setAuthView} />;
    } else if (authView === AUTH_WORKFLOWS.CHANGELOGS) {
      authContent = (
        <div style={{ minHeight: '100vh', padding: '32px 16px', backgroundColor: 'var(--bg-main, #f8fafc)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAuthView(AUTH_WORKFLOWS.LOGIN)}
              style={{ width: 'fit-content', minHeight: '40px' }}
            >
              &larr; Back to Sign In
            </button>
            <ChangelogView />
          </div>
        </div>
      );
    }

    return (
      <ErrorBoundary title="Sign In Error" onReset={() => setAuthView(AUTH_WORKFLOWS.LOGIN)}>
        {authContent}
        <MfaVerifyModal />
      </ErrorBoundary>
    );
  }

  // Self-Service Member Portal Role
  if (role === 'member') {
    return (
      <ErrorBoundary title="Member Portal Error" onReset={() => window.location.reload()}>
        <MemberPortalView />
        <MfaVerifyModal />
      </ErrorBoundary>
    );
  }

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
          title={getWorkflowTitle(currentView)}
          onOpenAreaSelector={() => setIsAreaSelectorOpen(true)}
          canSelectArea={canSwitchArea}
        />

        {/* Page Content View Router wrapped with per-view ErrorBoundary */}
        <ErrorBoundary
          key={currentView}
          title={`Error loading ${getWorkflowTitle(currentView)}`}
          onReset={() => setCurrentView('dashboard')}
        >
          <main className="page-wrapper" id="main-content">
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentView}
                onOpenNewMember={() => handleOpenAction('create-member', 'members')}
                onOpenNewEvent={() => handleOpenAction('create-event', 'events')}
                onOpenNewReport={() => handleOpenAction('create-report', 'reports')}
                onOpenNewGig={() => handleOpenAction('create-gig', 'gig')}
              />
            )}

            {currentView === 'members' && (
              <MembersView
                modalOpen={activeWorkflowAction === 'create-member'}
                onCloseModal={handleClearAction}
              />
            )}

            {currentView === 'chapters' && (
              <ChaptersView />
            )}

            {currentView === 'events' && (
              <EventsView
                modalOpen={activeWorkflowAction === 'create-event'}
                onCloseModal={handleClearAction}
              />
            )}

            {currentView === 'gig' && (
              <GigView
                modalOpen={activeWorkflowAction === 'create-gig'}
                onCloseModal={handleClearAction}
              />
            )}

            {currentView === 'reports' && (
              <ReportsView
                modalOpen={activeWorkflowAction === 'create-report'}
                onCloseModal={handleClearAction}
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

            {!isValidLeadershipRoute(currentView) && (
              <DashboardView onNavigate={setCurrentView} />
            )}
          </main>
        </ErrorBoundary>

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
