import React, { useState } from 'react';
import { AppHeader, BottomNavigation } from './components/AppChrome.jsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { HistoryTab } from './tabs/HistoryTab';
import { LeaderboardTab } from './tabs/LeaderboardTab';
import { RulesTab } from './tabs/RulesTab';
import { ScheduleTab } from './tabs/ScheduleTab';
import { ChampionshipTab } from './tabs/ChampionshipTab.jsx';
import { colors } from './themeTokens.js';

export default function GolfLeagueApp() {
  const championshipMode = import.meta.env.VITE_CHAMPIONSHIP_MODE === 'true'
    || (import.meta.env.DEV && new URLSearchParams(window.location.search).get('championshipPreview') === '1');
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState(championshipMode ? 'championship' : 'leaderboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'leaderboard': return <LeaderboardTab />;
      case 'schedule': return <ScheduleTab />;
      case 'championship': return championshipMode ? <ChampionshipTab /> : <ScheduleTab />;
      case 'rules': return <RulesTab />;
      case 'history': return <HistoryTab />;
      case 'analytics': return <AnalyticsTab />;
      default: return <LeaderboardTab />;
    }
  };

  if (showSplash) return <SplashScreen championshipMode={championshipMode} onComplete={() => setShowSplash(false)} />;

  return (
    <div style={{ minHeight: '100dvh', background: colors.offWhite, fontFamily: '"Source Sans 3", system-ui, sans-serif', position: 'relative', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      <AppHeader activeTab={activeTab} />

      <main id="main-content" style={{ paddingTop: 20 }}><ErrorBoundary key={activeTab}>{renderTab()}</ErrorBoundary></main>

      <BottomNavigation activeTab={activeTab} championshipMode={championshipMode} onChange={setActiveTab} />
    </div>
  );
}
