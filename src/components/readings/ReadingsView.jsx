import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { LoadingView, ErrorView } from '../common/StateViews';
import { ScriptureIcon, SyncIcon } from '../icons/Icons';

export function ReadingsView() {
  const [readingData, setReadingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/api/daily-readings');
      if (res?.ok && res.readings) {
        setReadingData(res.readings);
      } else {
        setError('Daily liturgical readings feed is currently unavailable.');
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve liturgical readings.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView message="Loading Catholic Daily Scripture Readings..." />;
  if (error && !readingData) return <ErrorView title="Daily Readings" error={error} onRetry={loadReadings} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem' }}>Daily Liturgical Scripture</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Catholic Mass readings and Gospel reflection for youth prayer and meditation
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={loadReadings}>
          <SyncIcon size={14} />
          Refresh
        </button>
      </div>

      <div className="card" style={{ padding: '28px' }}>
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px' }}>
          <span className="badge badge-info" style={{ marginBottom: '8px' }}>
            {readingData?.season || 'Liturgical Calendar'}
          </span>
          <h1 style={{ fontSize: '1.45rem', color: 'var(--text-main)', marginTop: '4px' }}>
            {readingData?.title || 'Daily Mass Readings'}
          </h1>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {readingData?.date || new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* First Reading */}
        {readingData?.first_reading && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--mfc-blue)', marginBottom: '6px' }}>
              First Reading: {readingData.first_reading_citation || ''}
            </h3>
            <p style={{ color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
              {readingData.first_reading}
            </p>
          </div>
        )}

        {/* Responsorial Psalm */}
        {readingData?.psalm && (
          <div style={{ marginBottom: '24px', backgroundColor: 'var(--bg-surface-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '6px' }}>
              Responsorial Psalm
            </h3>
            {readingData.psalm_response && (
              <div style={{ fontWeight: 600, color: 'var(--mfc-blue)', marginBottom: '8px' }}>
                R. {readingData.psalm_response}
              </div>
            )}
            <p style={{ color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
              {readingData.psalm}
            </p>
          </div>
        )}

        {/* Holy Gospel */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--mfc-blue)', marginBottom: '6px' }}>
            Holy Gospel: {readingData?.gospel_citation || ''}
          </h3>
          <p style={{ color: 'var(--text-main)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontSize: '0.98rem', fontWeight: 500 }}>
            {readingData?.gospel || readingData?.content || 'Praise to You, Lord Jesus Christ.'}
          </p>
        </div>

        {/* Reflection */}
        {readingData?.reflection && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              Youth Meditation & Prayer
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic', fontSize: '0.92rem' }}>
              {readingData.reflection}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
