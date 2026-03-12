import React, { useMemo, useState } from 'react';
import { DataBanner, ErrorState, LoadingState } from '../components/StatusBlocks';
import { parseStatsCSV, SHEETS_URLS } from '../data/sheets';
import { useSheetData } from '../hooks/useSheetData';
import { colors } from '../theme.jsx';

export const AnalyticsTab = () => {
  const { data, loading, error, isStale, lastUpdated, isOnline, refreshing, reload } = useSheetData({
    url: SHEETS_URLS.stats,
    cacheKey: 'stats',
    parser: parseStatsCSV,
    fallbackData: { players: [], lowestNetRecord: null, lowestGrossRecord: null, mostBirdiesRecord: null },
  });
  const [sortBy, setSortBy] = useState('avgNet');
  const [sortDir, setSortDir] = useState('asc');

  const analyticsData = data?.players || [];
  const sortedData = useMemo(() => [...analyticsData].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortDir === 'asc' ? valA - valB : valB - valA;
  }), [analyticsData, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortDir(field === 'birdies' || field === 'avgPts' ? 'desc' : 'asc');
    }
  };

  if (loading && analyticsData.length === 0) return <LoadingState label="Loading stats..." />;
  if (analyticsData.length === 0) return <ErrorState message={error || 'No stats available'} onRetry={reload} />;

  const columns = [
    { key: 'avgNet', shortLabel: 'Net' },
    { key: 'avgGross', shortLabel: 'Grs' },
    { key: 'avgHdcp', shortLabel: 'Hcp' },
    { key: 'birdies', shortLabel: 'Brd' },
    { key: 'missedWeeks', shortLabel: 'Miss' },
  ];

  return (
    <div style={{ padding: '0 16px 100px' }}>
      <DataBanner error={error} isStale={isStale} lastUpdated={lastUpdated} isOnline={isOnline} refreshing={refreshing} onRefresh={reload} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <SummaryCard title="Most Birdies" name={data?.mostBirdiesRecord?.player} score={data?.mostBirdiesRecord?.score} />
        <SummaryCard title="Lowest Net" name={data?.lowestNetRecord?.player} score={data?.lowestNetRecord?.score} />
        <SummaryCard title="Lowest Gross" name={data?.lowestGrossRecord?.player} score={data?.lowestGrossRecord?.score} />
      </div>
      <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Sort By:</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        {[{ key: 'avgNet', label: 'Avg Net' }, { key: 'avgGross', label: 'Avg Gross' }, { key: 'avgPts', label: 'Avg Pts' }, { key: 'birdies', label: 'Birdies' }, { key: 'avgHdcp', label: 'Handicap' }].map((stat) => <button key={stat.key} type="button" onClick={() => handleSort(stat.key)} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: sortBy === stat.key ? colors.green : colors.offWhiteMuted, color: sortBy === stat.key ? colors.offWhite : colors.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>{stat.label}{sortBy === stat.key && <span style={{ fontSize: 9 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>)}
      </div>
      <div style={{ background: colors.offWhite, borderRadius: 16, overflow: 'hidden', border: `2px solid ${colors.green}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 0.6fr 0.6fr', padding: '10px 10px', background: colors.green, borderBottom: `1px solid ${colors.greenDark}`, gap: 4 }}>
          <div onClick={() => handleSort('player')} style={{ fontSize: 10, color: sortBy === 'player' ? colors.yellow : colors.offWhiteMuted, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', fontWeight: sortBy === 'player' ? 700 : 500 }}>Player</div>
          {columns.map((col) => <div key={col.key} onClick={() => handleSort(col.key)} style={{ fontSize: 10, color: sortBy === col.key ? colors.yellow : colors.offWhiteMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', cursor: 'pointer', fontWeight: sortBy === col.key ? 700 : 500 }}>{col.shortLabel}</div>)}
        </div>
        {sortedData.map((player, idx) => <div key={player.player} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 0.6fr 0.6fr', padding: '10px 10px', borderBottom: idx < sortedData.length - 1 ? `1px solid ${colors.offWhiteMuted}` : 'none', background: idx % 2 === 0 ? 'transparent' : colors.offWhiteMuted, gap: 4, alignItems: 'center' }}><div style={{ fontSize: 13, color: colors.greenDark, fontWeight: 600 }}>{player.player}</div><Cell active={sortBy === 'avgNet'} value={player.avgNet} /><Cell active={sortBy === 'avgGross'} muted value={player.avgGross} /><Cell active={sortBy === 'avgHdcp'} muted value={player.avgHdcp} /><Cell active={sortBy === 'birdies'} value={player.birdies} /><Cell active={sortBy === 'missedWeeks'} muted={player.missedWeeks > 0} value={player.missedWeeks} /></div>)}
      </div>
      <p style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 16 }}>Tap pills or column headers to sort</p>
    </div>
  );
};

const SummaryCard = ({ title, name, score }) => <div style={{ background: colors.green, borderRadius: 12, padding: 12, textAlign: 'center' }}><p style={{ fontSize: 10, color: colors.offWhiteMuted, textTransform: 'uppercase' }}>{title}</p><p style={{ fontSize: 16, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>{name || '--'}</p><p style={{ fontSize: 11, color: colors.offWhiteMuted }}>({score || '--'})</p></div>;
const Cell = ({ active, muted = false, value }) => <div style={{ fontSize: 13, color: active ? colors.green : muted ? colors.textMuted : colors.greenDark, fontWeight: active ? 700 : 500, textAlign: 'center' }}>{value}</div>;
