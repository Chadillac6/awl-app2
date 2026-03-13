import React from 'react';
import { DataBanner, ErrorState, LoadingState } from '../components/StatusBlocks';
import { defaultWeekHeaders, parseLeaderboardCSV, SHEETS_URLS } from '../data/sheets';
import { useSheetData } from '../hooks/useSheetData';
import { colors } from '../theme.jsx';

export const LeaderboardTab = () => {
  const { data, loading, error, isStale, lastUpdated, isOnline, refreshing, reload } = useSheetData({
    url: SHEETS_URLS.leaderboard,
    cacheKey: 'leaderboard',
    parser: parseLeaderboardCSV,
    fallbackData: { leaderboard: null, leagueStats: null, weekHeaders: defaultWeekHeaders },
  });

  if (loading && !data?.leaderboard) return <LoadingState label="Loading leaderboard..." />;
  if (!data?.leaderboard) return <ErrorState message={error || 'Unable to load leaderboard'} onRetry={reload} />;

  const { leaderboard, leagueStats, weekHeaders = defaultWeekHeaders } = data;
  const groups = ['groupA', 'groupB', 'groupC', 'groupD'];
  const groupLabels = { groupA: 'Group A', groupB: 'Group B', groupC: 'Group C', groupD: 'Group D' };
  const headers = weekHeaders.length > 0 ? weekHeaders.map((h) => (h === 'Major' ? 'S.O.' : h)) : defaultWeekHeaders;
  const gridTemplate = `28px 70px 50px repeat(${headers.length}, 36px)`;
  const minTableWidth = 150 + (headers.length * 36);

  return (
    <div style={{ padding: '0 16px 100px' }}>
      <DataBanner error={error} isStale={isStale} lastUpdated={lastUpdated} isOnline={isOnline} refreshing={refreshing} onRefresh={reload} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatCard title="Birdie Leader" value={leagueStats?.birdieLeader?.count || 0} subtitle={leagueStats?.birdieLeader?.name || '--'} />
        <StatCard title="League Birdies" value={leagueStats?.totalBirdies || 0} subtitle="This Season" />
        <StatCard title="Pot Total" value={`$${(leagueStats?.totalBirdies || 0) * 8}`} subtitle="$0.50 Per Birdie" />
      </div>

      <div style={{ background: colors.offWhite, borderRadius: 16, overflow: 'hidden', border: `2px solid ${colors.green}`, marginBottom: 20 }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: minTableWidth }}>
            <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, padding: '10px 8px', background: colors.green, position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={headerCell}>#</div>
              <div style={headerCell}>Player</div>
              <div style={{ ...headerCell, textAlign: 'center' }}>Tot</div>
              {headers.map((w) => <div key={w} style={{ ...headerCell, textAlign: 'center', color: w === 'S.O.' ? colors.yellow : colors.offWhiteMuted, fontWeight: w === 'S.O.' ? 700 : 400 }}>{w}</div>)}
            </div>

            {groups.map((groupKey) => (
              <React.Fragment key={groupKey}>
                <div style={{ padding: '8px 12px', background: colors.offWhiteMuted, borderTop: `1px solid ${colors.green}20` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.green, textTransform: 'uppercase', letterSpacing: 1 }}>{groupLabels[groupKey]}</span>
                </div>
                {(leaderboard[groupKey] || []).map((player, idx) => (
                  <div key={player.name} style={{ display: 'grid', gridTemplateColumns: gridTemplate, padding: '8px 8px', borderBottom: `1px solid ${colors.offWhiteMuted}`, background: idx % 2 === 0 ? 'white' : colors.offWhite, alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: idx === 0 ? colors.yellow : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : colors.offWhiteMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: colors.greenDark }}>{player.rank}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.greenDark }}>{player.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.green, textAlign: 'center' }}>{player.total}</div>
                    {player.weeks.map((pts, i) => <div key={`${player.name}-${i}`} style={{ fontSize: 11, textAlign: 'center', color: pts >= 4 ? colors.green : pts === 0 ? colors.offWhiteMuted : colors.textDark, fontWeight: pts >= 4 ? 700 : 400 }}>{pts}</div>)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', padding: '8px' }}>Swipe to see weekly points</p>
      </div>

      {leagueStats?.weeklyLowWinners?.length > 0 && (
        <>
          <h3 style={{ fontFamily: '"Playfair Display", Georgia', fontSize: 18, color: colors.greenDark, marginBottom: 12 }}>Weekly Low Net Winners</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {leagueStats.weeklyLowWinners.map((winner, idx) => (
              <div key={`winner-${idx}`} style={{ background: colors.offWhite, borderRadius: 12, padding: 12, border: `1px solid ${colors.offWhiteMuted}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: colors.yellow, fontWeight: 600 }}>Week {winner.week}</p>
                  <p style={{ fontSize: 11, color: colors.green, fontWeight: 700 }}>{winner.payout}</p>
                </div>
                <p style={{ fontWeight: 600, color: colors.greenDark, fontSize: 14, lineHeight: 1.35 }}>
                  {winner.name}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const headerCell = { fontSize: 9, color: colors.offWhiteMuted, textTransform: 'uppercase' };

const StatCard = ({ title, value, subtitle }) => (
  <div style={{ background: colors.offWhite, borderRadius: 16, padding: 14, border: `2px solid ${colors.green}` }}>
    <p style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{title}</p>
    <p style={{ fontSize: 24, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>{value}</p>
    <p style={{ fontSize: 11, color: colors.green }}>{subtitle}</p>
  </div>
);
