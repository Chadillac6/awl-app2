import React, { useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { HistoryTab } from './tabs/HistoryTab';
import { LeaderboardTab } from './tabs/LeaderboardTab';
import { RulesTab } from './tabs/RulesTab';
import { ScheduleTab } from './tabs/ScheduleTab';
import { colors, Icons, SunLogo } from './theme.jsx';

const tabs = [
  { id: 'leaderboard', label: 'Leaderboard', icon: Icons.leaderboard },
  { id: 'schedule', label: 'Schedule', icon: Icons.schedule },
  { id: 'rules', label: 'Rules', icon: Icons.rules },
  { id: 'history', label: 'History', icon: Icons.history },
  { id: 'analytics', label: 'Stats', icon: Icons.analytics },
];

const tabTitles = {
  leaderboard: 'Leaderboard',
  schedule: 'Schedule',
  rules: 'League Rules',
  history: 'Hall of Fame',
  analytics: 'Player Stats',
};

export default function GolfLeagueApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'leaderboard': return <LeaderboardTab />;
      case 'schedule': return <ScheduleTab />;
      case 'rules': return <RulesTab />;
      case 'history': return <HistoryTab />;
      case 'analytics': return <AnalyticsTab />;
      default: return <LeaderboardTab />;
    }
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  return (
    <div style={{ minHeight: '100dvh', background: colors.offWhite, fontFamily: '"Source Sans 3", system-ui, sans-serif', position: 'relative', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)', paddingBottom: 14, paddingLeft: 18, paddingRight: 18, background: colors.green, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: colors.offWhite, margin: 0, lineHeight: 1.05 }}>{tabTitles[activeTab] || 'AWL'}</h1>
          <p style={{ fontSize: 11, color: colors.yellow, marginTop: 1, letterSpacing: 0.9, fontWeight: 600 }}>AM WALKING LEAGUE</p>
        </div>
        <SunLogo size={40} />
      </div>

      <div style={{ paddingTop: 20 }}>{renderTab()}</div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.green, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: '4px 0 calc(6px + env(safe-area-inset-bottom, 0px))', display: 'flex', justifyContent: 'space-around', boxShadow: '0 -6px 18px rgba(10, 92, 46, 0.14)' }}>
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{ background: 'none', border: 'none', padding: '5px 0 2px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', color: activeTab === tab.id ? colors.yellow : colors.offWhiteMuted, transition: 'all 0.2s ease' }} aria-label={tab.label}>
            <div style={{ transform: activeTab === tab.id ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>{tab.icon}</div>
            <span style={{ fontSize: 9, lineHeight: 1, fontWeight: activeTab === tab.id ? 600 : 400, letterSpacing: 0.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{tab.label}</span>
            {activeTab === tab.id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: colors.yellow, marginTop: -2 }} />}
          </button>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: ${colors.textMuted}; }
        ::-webkit-scrollbar { display: none; }
        html, body { -webkit-overflow-scrolling: touch; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
        }
      `}</style>
    </div>
  );
}
