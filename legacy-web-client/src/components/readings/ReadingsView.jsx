import React from 'react';
import { useReadings } from '../../hooks/useReadings';
import { LoadingView, ErrorView } from '../common/StateViews';
import { ScriptureIcon, SyncIcon } from '../icons/Icons';

export function ReadingsView() {
  const {
    date,
    setDate,
    readings,
    celebration,
    day,
    translation,
    loading,
    error,
    refresh
  } = useReadings();

  const handleDateChange = (e) => {
    if (e.target.value) {
      setDate(e.target.value);
    }
  };

  const getPreviousDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const getNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const getToday = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(new Date());

      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      setDate(`${y}-${m}-${d}`);
    } catch {
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  if (loading && readings.length === 0) {
    return <LoadingView message="Loading Catholic Daily Scripture Readings..." />;
  }

  if (error && readings.length === 0) {
    return <ErrorView title="Daily Readings" error={error} onRetry={refresh} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      {/* Header & Date Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScriptureIcon size={22} />
            Daily Liturgical Scripture
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Catholic Mass readings and Gospel reflection synced to Philippine Standard Time (PST / Asia/Manila).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderRadius: 'var(--radius-md, 8px)', padding: '2px 4px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={getPreviousDay}
              style={{ minHeight: '36px', padding: '0 8px' }}
              title="Previous Day"
            >
              &larr;
            </button>
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '4px 6px',
                color: 'var(--text-main)'
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={getNextDay}
              style={{ minHeight: '36px', padding: '0 8px' }}
              title="Next Day"
            >
              &rarr;
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={getToday}
            style={{ minHeight: '36px' }}
          >
            Today
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={refresh}
            style={{ minHeight: '36px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <SyncIcon size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Liturgical Readings Card */}
      <div className="card" style={{ padding: '28px', border: '1px solid var(--border-subtle)' }}>
        {/* Banner with Celebration & Translation */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              {day} · {date}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Translation: <strong>{translation}</strong>
            </span>
          </div>

          <h1 style={{ fontSize: '1.45rem', color: 'var(--mfc-blue, #002847)', margin: '4px 0 0 0', lineHeight: 1.3 }}>
            {celebration || 'Daily Liturgical Celebration'}
          </h1>
        </div>

        {/* Dynamic Readings Content List */}
        {readings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {readings.map((r, idx) => {
              const isPsalm = /psalm/i.test(r.type);
              const isGospel = /gospel/i.test(r.type);

              return (
                <article
                  key={idx}
                  style={{
                    backgroundColor: isPsalm ? 'rgba(0, 40, 71, 0.03)' : (isGospel ? 'rgba(37, 99, 235, 0.03)' : 'transparent'),
                    padding: isPsalm || isGospel ? '18px 20px' : '0',
                    borderRadius: 'var(--radius-md, 8px)',
                    borderLeft: isGospel ? '4px solid var(--mfc-blue, #002847)' : (isPsalm ? '3px solid #64748b' : 'none')
                  }}
                >
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: isGospel ? 'var(--mfc-blue, #002847)' : 'var(--text-muted)'
                    }}>
                      {r.type}
                    </span>
                    <h3 style={{
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      margin: '2px 0 0 0'
                    }}>
                      {r.reference}
                    </h3>
                  </div>

                  {r.text && (
                    <div style={{
                      fontSize: '1rem',
                      lineHeight: 1.8,
                      color: 'var(--text-main)',
                      whiteSpace: 'pre-line',
                      fontFamily: 'Georgia, Cambria, serif',
                      letterSpacing: '0.01em'
                    }}>
                      {r.text}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <p>No reading texts available for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
