import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContent from './App';
import { ThemeProvider } from './context/ThemeContext';
import { OfflineProvider } from './context/OfflineContext';
import { AuthProvider } from './context/AuthContext';
import { platform } from './services/platform';
import './web-style.css';
import './index.css';

// Initialize native platform bridge (Capacitor/Tauri/Electron)
platform.init();

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <OfflineProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </OfflineProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}
