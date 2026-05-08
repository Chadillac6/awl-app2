import { useState } from 'react';
import { getPushSupport, subscribeToLeaderboardPush } from '../lib/pushNotifications.js';
import { colors } from '../themeTokens.js';

export const PushNotificationCard = () => {
  const [support, setSupport] = useState(() => (typeof window === 'undefined' ? null : getPushSupport()));
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  if (!support) return null;

  const enabled = support.permission === 'granted';
  const denied = support.permission === 'denied';
  const canPrompt = support.supported && !denied;
  const showInstallHint = support.supported && !support.installed;

  const handleEnable = async () => {
    setStatus('saving');
    setMessage('');
    try {
      await subscribeToLeaderboardPush();
      setSupport(getPushSupport());
      setStatus('enabled');
      setMessage('Leaderboard alerts are on for this device.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Could not enable alerts.');
      setSupport(getPushSupport());
    }
  };

  return (
    <div style={{ background: 'white', border: `1px solid ${colors.green}24`, borderRadius: 16, padding: 14, marginBottom: 14, boxShadow: '0 8px 18px rgba(10, 92, 46, 0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: colors.greenDark, marginBottom: 2 }}>Leaderboard alerts</p>
          <p style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.35 }}>
            {enabled ? 'You’ll get a push when new standings are posted.' : 'Enable iPhone alerts when league standings update.'}
          </p>
        </div>
        <button type="button" onClick={handleEnable} disabled={!canPrompt || enabled || status === 'saving'} style={{ border: 'none', borderRadius: 999, padding: '8px 12px', background: enabled ? colors.offWhiteMuted : colors.green, color: enabled ? colors.greenDark : colors.offWhite, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', opacity: (!canPrompt || status === 'saving') && !enabled ? 0.55 : 1 }}>
          {enabled ? 'On' : status === 'saving' ? 'Saving…' : 'Enable'}
        </button>
      </div>
      {showInstallHint && <p style={{ fontSize: 10, color: colors.textMuted, marginTop: 8 }}>On iPhone, install AWL to your Home Screen first, then open it from the icon to enable push alerts.</p>}
      {!support.supported && <p style={{ fontSize: 10, color: colors.textMuted, marginTop: 8 }}>{support.missingReason}</p>}
      {denied && <p style={{ fontSize: 10, color: '#9b2c2c', marginTop: 8 }}>Notifications are blocked for this app. Enable them in iOS Settings to receive alerts.</p>}
      {message && <p style={{ fontSize: 10, color: status === 'error' ? '#9b2c2c' : colors.green, marginTop: 8 }}>{message}</p>}
    </div>
  );
};
