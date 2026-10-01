import React from 'react';
import { SyncIcon } from '../icons/Icons';

/**
 * Full Application Shell Loading Wireframe
 * Rendered on root app load so the user sees a complete, polished wireframe
 * instead of a blank screen or a lone spinner.
 */
export function AppLoadingWireframe() {
  return (
    <div className="skeleton-app-shell" aria-hidden="true">
      {/* Sidebar Wireframe */}
      <aside className="skeleton-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span className="skeleton-block" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="skeleton-line" style={{ width: '80%', height: '14px' }} />
            <span className="skeleton-line" style={{ width: '50%', height: '10px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <span
              key={i}
              className="skeleton-block"
              style={{ width: '100%', height: '40px', borderRadius: '8px', opacity: 1 - i * 0.08 }}
            />
          ))}
        </div>
      </aside>

      {/* Main View Wireframe */}
      <div className="skeleton-main">
        <header className="skeleton-topbar">
          <span className="skeleton-line" style={{ width: '180px', height: '22px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="skeleton-line" style={{ width: '110px', height: '32px', borderRadius: '999px' }} />
            <span className="skeleton-block" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
          </div>
        </header>

        <main className="skeleton-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="skeleton-line" style={{ width: '220px', height: '24px' }} />
              <span className="skeleton-line" style={{ width: '320px', height: '14px' }} />
            </div>
            <span className="skeleton-block" style={{ width: '120px', height: '40px', borderRadius: '8px' }} />
          </div>

          <div className="skeleton-card-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card">
                <span className="skeleton-line" style={{ width: '55%', height: '12px' }} />
                <span className="skeleton-line" style={{ width: '38%', height: '28px' }} />
                <span className="skeleton-line" style={{ width: '80%', height: '11px' }} />
              </div>
            ))}
          </div>

          <div className="skeleton-table-wrapper" style={{ minHeight: '260px' }}>
            <div className="skeleton-table-header-row">
              <span className="skeleton-line" style={{ flex: 2, height: '14px' }} />
              <span className="skeleton-line" style={{ flex: 2, height: '14px' }} />
              <span className="skeleton-line" style={{ flex: 1.5, height: '14px' }} />
              <span className="skeleton-line" style={{ flex: 1, height: '14px' }} />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-table-row">
                <span className="skeleton-line" style={{ flex: 2, height: '14px' }} />
                <span className="skeleton-line" style={{ flex: 2, height: '14px' }} />
                <span className="skeleton-line" style={{ flex: 1.5, height: '14px' }} />
                <span className="skeleton-line" style={{ flex: 1, height: '14px' }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Dashboard Specific Skeleton Loader
 */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-content skeleton-fade" aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span className="skeleton-line" style={{ width: '240px', height: '26px' }} />
          <span className="skeleton-line" style={{ width: '360px', height: '14px' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="skeleton-block" style={{ width: '130px', height: '40px', borderRadius: '8px' }} />
          <span className="skeleton-block" style={{ width: '130px', height: '40px', borderRadius: '8px' }} />
        </div>
      </div>

      <div className="skeleton-card-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="skeleton-line" style={{ width: '50%', height: '13px' }} />
              <span className="skeleton-block" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
            </div>
            <span className="skeleton-line" style={{ width: '40%', height: '32px', margin: '4px 0' }} />
            <span className="skeleton-line" style={{ width: '75%', height: '11px' }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="skeleton-table-wrapper" style={{ padding: '20px' }}>
          <span className="skeleton-line" style={{ width: '160px', height: '18px', marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="skeleton-block" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className="skeleton-line" style={{ width: '70%', height: '14px' }} />
                  <span className="skeleton-line" style={{ width: '40%', height: '10px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="skeleton-table-wrapper" style={{ padding: '20px' }}>
          <span className="skeleton-line" style={{ width: '160px', height: '18px', marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="skeleton-block" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className="skeleton-line" style={{ width: '65%', height: '14px' }} />
                  <span className="skeleton-line" style={{ width: '45%', height: '10px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Table & Directory Skeleton Loader
 */
export function TableSkeleton({ rows = 5, columns = 4, title = 'Loading records...' }) {
  return (
    <div className="skeleton-table-container skeleton-fade" aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span className="skeleton-line" style={{ width: '200px', height: '22px' }} />
          <span className="skeleton-line" style={{ width: '280px', height: '12px' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="skeleton-block" style={{ width: '180px', height: '38px', borderRadius: '8px' }} />
          <span className="skeleton-block" style={{ width: '110px', height: '38px', borderRadius: '8px' }} />
        </div>
      </div>

      <div className="skeleton-table-wrapper">
        <div className="skeleton-table-header-row">
          {Array.from({ length: columns }).map((_, c) => (
            <span key={c} className="skeleton-line" style={{ flex: 1, height: '14px' }} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, c) => (
              <span key={c} className="skeleton-line" style={{ flex: 1, height: '14px' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card Grid Skeleton Loader
 */
export function CardsSkeleton({ count = 6 }) {
  return (
    <div className="skeleton-card-grid skeleton-fade" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card" style={{ minHeight: '130px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="skeleton-line" style={{ width: '55%', height: '14px' }} />
            <span className="skeleton-line" style={{ width: '40px', height: '18px', borderRadius: '999px' }} />
          </div>
          <span className="skeleton-line" style={{ width: '80%', height: '11px', marginTop: '6px' }} />
          <span className="skeleton-line" style={{ width: '60%', height: '11px' }} />
          <span className="skeleton-line" style={{ width: '35%', height: '24px', borderRadius: '6px', marginTop: 'auto' }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Standard Loading View fallback
 */
export function LoadingView({ message = 'Loading area records...', type = 'table' }) {
  if (type === 'dashboard') {
    return <DashboardSkeleton />;
  }
  if (type === 'cards') {
    return <CardsSkeleton />;
  }
  return <TableSkeleton title={message} />;
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

export const LoadingState = LoadingView;
export const EmptyState = EmptyView;
export const ErrorState = ErrorView;
