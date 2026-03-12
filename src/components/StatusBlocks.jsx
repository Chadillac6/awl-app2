import React from 'react';
import { colors } from '../theme.jsx';

export const LoadingState = ({ label = 'Loading...' }) => (
  <div style={{ padding: '40px 16px', textAlign: 'center' }}>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: colors.green, animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />
      ))}
    </div>
    <p style={{ color: colors.textMuted }}>{label}</p>
  </div>
);

export const ErrorState = ({ message, onRetry, hasCachedData = false }) => (
  <div style={{ padding: '24px 16px' }}>
    <div style={{ background: colors.offWhite, border: `1px solid ${colors.offWhiteMuted}`, borderRadius: 16, padding: 16, textAlign: 'center' }}>
      <p style={{ fontWeight: 700, color: colors.greenDark, marginBottom: 6 }}>Data issue</p>
      <p style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.5 }}>{message}</p>
      {hasCachedData && <p style={{ color: colors.green, fontSize: 12, marginTop: 8 }}>Using the most recent saved data on this device.</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} style={{ marginTop: 14, background: colors.green, color: colors.offWhite, border: 'none', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
          Try again
        </button>
      )}
    </div>
  </div>
);

export const DataBanner = ({ error, isStale, lastUpdated, isOnline, refreshing, onRefresh }) => {
  if (!error && !isStale && isOnline && !refreshing) return null;

  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <div style={{ margin: '0 16px 16px', background: colors.offWhite, borderRadius: 14, border: `1px solid ${colors.offWhiteMuted}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: isOnline ? colors.greenDark : colors.yellow }}> {isOnline ? (isStale ? 'Live refresh delayed' : 'Connected') : 'Offline mode'} </p>
        <p style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
          {error || (isStale ? `Showing saved data${updatedLabel ? ` from ${updatedLabel}` : ''}.` : 'Live data is current.')}
        </p>
      </div>
      {onRefresh && (
        <button type="button" onClick={onRefresh} disabled={refreshing} style={{ background: colors.green, color: colors.offWhite, border: 'none', borderRadius: 999, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', opacity: refreshing ? 0.7 : 1 }}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      )}
    </div>
  );
};
