import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContent from './App';
import { ThemeProvider } from './context/ThemeContext';
import { OfflineProvider } from './context/OfflineContext';
import { AuthProvider } from './context/AuthContext';
import { platform } from './services/platform';
import ErrorBoundary from './components/common/ErrorBoundary';
import './web-style.css';
import './index.css';

// Initialize native platform bridge (Capacitor/Tauri/Electron)
platform.init();

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary fullScreen title="MFC Youth Area Management System Error">
        <ThemeProvider>
          <OfflineProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </OfflineProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
