import React from 'react';
import { SyncIcon } from '../icons/Icons';

export function LoadingView({ message = 'Loading area records...' }) {
  return (
    <div className="state-container" role="status" aria-live="polite">
      <div className="spinner" />
      <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}

export function EmptyView({
  title = 'No records found',
  description = 'There are currently no items in this view.',
  actionLabel,
  onAction,
  icon: Icon
}) {
  return (
    <div className="state-container">
      {Icon && <Icon size={44} className="state-icon" />}
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn btn-primary" style={{ marginTop: '12px' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorView({
  title = 'Unable to load records',
  error,
  onRetry
}) {
  return (
    <div className="state-container" role="alert">
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1.4rem'
        }}
      >
        !
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description" style={{ color: 'var(--color-danger)' }}>
        {error || 'An unexpected network error occurred.'}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary" style={{ marginTop: '12px' }}>
          <SyncIcon size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}
