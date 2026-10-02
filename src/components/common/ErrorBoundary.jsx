import React from 'react';
import { SyncIcon } from '../icons/Icons';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught runtime UI error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: this.props.fullScreen ? '100vh' : '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-main, #f8fafc)',
            color: 'var(--text-main, #0f172a)'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
              padding: '32px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 700
              }}
            >
              !
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                {this.props.title || 'Something went wrong'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                {this.state.error?.message || 'An unexpected rendering error occurred. The system kept your data safe.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleReset}
                style={{ minHeight: '44px', minWidth: '130px' }}
              >
                <SyncIcon size={16} />
                Try Again
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={this.handleReload}
                style={{ minHeight: '44px', minWidth: '130px' }}
              >
                Refresh App
              </button>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details
                style={{
                  width: '100%',
                  marginTop: '16px',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #64748b)',
                  backgroundColor: 'var(--bg-main, #f1f5f9)',
                  padding: '12px',
                  borderRadius: '8px',
                  overflowX: 'auto'
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Technical details</summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                  {this.state.error?.stack || String(this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
