import { colors } from '../themeTokens.js';
import { SunLogo } from '../theme.jsx';
import { AnalyticsIcon, HistoryIcon, LeaderboardIcon, RulesIcon, ScheduleIcon } from '../uiIcons.jsx';

const tabs = [
  { id: 'leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
  { id: 'schedule', label: 'Schedule', icon: ScheduleIcon },
  { id: 'rules', label: 'Rules', icon: RulesIcon },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'analytics', label: 'Stats', icon: AnalyticsIcon },
];

const ChampionshipIcon = () => (
  <span style={{ position: 'relative', width: 32, height: 32, display: 'grid', placeItems: 'center' }}>
    <span style={{ position: 'absolute', inset: 0 }}><SunLogo size={32} /></span>
    <svg width="18" height="18" viewBox="0 0 120 120" fill="none" stroke={colors.greenDark} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
      <path d="M43 31h34v18c0 17-8 27-17 27S43 66 43 49z" />
      <path d="M43 38H30c0 15 6 23 19 24M77 38h13c0 15-6 23-19 24M60 76v13M44 93h32" />
    </svg>
  </span>
);

const tabTitles = {
  leaderboard: 'Leaderboard',
  schedule: 'Schedule',
  championship: 'Championship',
  rules: 'League Rules',
  history: 'Hall of Fame',
  analytics: 'Player Stats',
};

export const AppHeader = ({ activeTab }) => (
  <header style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)', paddingBottom: 14, paddingLeft: 18, paddingRight: 18, background: colors.green, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: colors.offWhite, margin: 0, lineHeight: 1.05 }}>{tabTitles[activeTab] || 'AWL'}</h1>
      <p style={{ fontSize: 11, color: colors.yellow, marginTop: 1, letterSpacing: 0.9, fontWeight: 600 }}>AM WALKING LEAGUE</p>
    </div>
    <SunLogo size={40} />
  </header>
);

export const BottomNavigation = ({ activeTab, championshipMode = false, onChange }) => {
  const visibleTabs = championshipMode
    ? tabs.map((tab) => tab.id === 'schedule' ? { id: 'championship', label: 'Championship', icon: ChampionshipIcon } : tab)
    : tabs;

  return (
  <nav aria-label="Primary" style={{ position: 'fixed', zIndex: 1000, bottom: 0, left: 0, right: 0, background: colors.green, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: '4px 0 calc(6px + env(safe-area-inset-bottom, 0px))', display: 'flex', justifyContent: 'space-around', boxShadow: '0 -6px 18px rgba(10, 92, 46, 0.14)' }}>
    {visibleTabs.map((tab) => {
      const Icon = tab.icon;
      const active = activeTab === tab.id;
      return (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)} aria-label={tab.label} aria-current={active ? 'page' : undefined} style={{ background: 'none', border: 'none', padding: '5px 0 2px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', color: active ? colors.yellow : colors.offWhiteMuted, transition: 'color 0.2s ease' }}>
          <span aria-hidden="true" style={{ display: 'flex', transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}><Icon /></span>
          <span style={{ fontSize: 9, lineHeight: 1, fontWeight: active ? 600 : 400, letterSpacing: 0.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{tab.label}</span>
          {active && <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: '50%', background: colors.yellow, marginTop: -2 }} />}
        </button>
      );
    })}
  </nav>
  );
};
