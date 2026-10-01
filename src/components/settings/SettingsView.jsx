import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useOffline } from '../../context/OfflineContext';
import { getApiBaseUrl, setCustomApiBaseUrl, apiRequest } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { SunIcon, MoonIcon, SyncIcon, CheckIcon } from '../icons/Icons';

export function SettingsView() {
  const { user, role, areaName, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isOnline, pendingCount, triggerSync, isSyncing, setIsSyncModalOpen } = useOffline();

  const [apiUrl, setApiUrl] = useState(() => getApiBaseUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // { ok: bool, message: string }

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSaveApiUrl = () => {
    setCustomApiBaseUrl(apiUrl);
    setConnectionStatus({ ok: true, message: 'Server URL saved. App will use this address for network sync.' });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const target = apiUrl ? `${apiUrl.replace(/\/+$/, '')}/api/health` : '/api/health';
      const res = await fetch(target, { method: 'GET', cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data?.databaseConnected) {
        setConnectionStatus({
          ok: true,
          message: `Connected successfully! Database: ${data.database || 'Supabase Postgres'}, Phase: ${data.backendPhase || 'Active'}`
        });
      } else {
        setConnectionStatus({
          ok: false,
          message: data?.error || `Connected to server, but database check returned: ${res.status}`
        });
      }
    } catch (err) {
      setConnectionStatus({
        ok: false,
        message: `Connection failed: ${err.message}. Ensure backend is running.`
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ ok: false, message: 'Password must be at least 8 characters.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      const res = await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword
        })
      });

      if (res?.ok) {
        setPasswordMsg({ ok: true, message: 'Password updated successfully.' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ ok: false, message: res?.error || 'Failed to change password.' });
      }
    } catch (err) {
      setPasswordMsg({ ok: false, message: err.message || 'Error updating password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '750px', margin: '0 auto', width: '100%' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem' }}>Application Settings & Preferences</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Manage your account profile, local offline cache, and server connection
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Account Profile</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Name</div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Servant Leader'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Email Address</div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              {user?.email || 'Not available'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Access Role</div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', textTransform: 'capitalize' }}>
              {(role || 'Member').replace(/_/g, ' ')}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Assigned Area</div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              {areaName || 'Area Roster'}
            </div>
          </div>
        </div>
      </div>

      {/* Backend Server URL Configuration (Crucial for Mobile and Desktop apps) */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Server Connection (Cloud Database)</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Native desktop and mobile apps connect to this backend endpoint.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="serverUrl">Backend Server Base URL</label>
          <input
            id="serverUrl"
            type="url"
            className="form-input"
            placeholder="http://localhost:3001 or https://mfc-youth.vercel.app"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </div>

        {connectionStatus && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: connectionStatus.ok ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: connectionStatus.ok ? 'var(--color-success)' : 'var(--color-danger)',
              border: `1px solid ${connectionStatus.ok ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
              marginBottom: '14px',
              fontSize: '0.85rem'
            }}
          >
            {connectionStatus.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testingConnection}
          >
            <SyncIcon size={16} spinning={testingConnection} />
            {testingConnection ? 'Testing Connection...' : 'Test Connection'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveApiUrl}
          >
            Save Server URL
          </button>
        </div>
      </div>

      {/* Offline Storage & Outbox */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Offline Engine & Outbox Sync</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Status: <strong>{isOnline ? 'Online (Ready to sync)' : 'Offline (Local persistence active)'}</strong>
            </p>
          </div>
          <span className={`badge ${isOnline ? 'badge-success' : 'badge-warning'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.9rem' }}>
            Pending Offline Outbox Mutations: <strong>{pendingCount}</strong>
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsSyncModalOpen(true)}
          >
            Inspect Outbox
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={triggerSync}
            disabled={!isOnline || isSyncing || pendingCount === 0}
          >
            <SyncIcon size={16} spinning={isSyncing} />
            {isSyncing ? 'Syncing...' : 'Sync All Pending Changes'}
          </button>
        </div>
      </div>

      {/* Theme Appearance (R-21 / R-34 compliant) */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Appearance & Accessibility</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              Color Theme
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Currently using <strong>{isDark ? 'Dark Mode' : 'Light Mode'}</strong>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
          >
            {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
          </button>
        </div>
      </div>

      {/* Security: Change Password */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Security & Password</h3>
        </div>

        <form onSubmit={handleChangePassword}>
          {passwordMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: passwordMsg.ok ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                color: passwordMsg.ok ? 'var(--color-success)' : 'var(--color-danger)',
                border: `1px solid ${passwordMsg.ok ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                marginBottom: '16px',
                fontSize: '0.85rem'
              }}
            >
              {passwordMsg.message}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="oldPassword">Current Password</label>
            <input
              id="oldPassword"
              type="password"
              required
              className="form-input"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                required
                className="form-input"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="form-input"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '6px' }}
            disabled={passwordLoading}
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Sign Out Card */}
      <div className="card" style={{ border: '1px solid var(--color-danger-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: '0.95rem' }}>
              Sign Out of Area Session
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              End active session on this device. Cached records will remain saved.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
