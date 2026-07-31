import React, { useMemo, useState } from 'react';
import { DataBanner, ErrorState, LoadingState } from '../components/StatusBlocks';
import { parseStatsCSV, SHEETS_URLS } from '../data/sheets';
import { useSheetData } from '../hooks/useSheetData';
import { colors } from '../themeTokens.js';

const SEASON_COLUMNS = [
  { key: 'avgNet', shortLabel: 'Net', label: 'Avg Net', align: 'center' },
  { key: 'avgGross', shortLabel: 'Grs', label: 'Avg Gross', align: 'center', muted: true },
  { key: 'avgHdcp', shortLabel: 'Hcp', label: 'Avg Hdcp', align: 'center', muted: true },
  { key: 'avgPts', shortLabel: 'Pts', label: 'Avg Pts', align: 'center' },
  { key: 'birdies', shortLabel: 'Brd', label: 'Birdies', align: 'center' },
  { key: 'missedWeeks', shortLabel: 'Miss', label: 'Missed', align: 'center', muted: true },
];

const WEEK_COLUMNS = [
  { key: 'gross', shortLabel: 'Grs', label: 'Gross', align: 'center', muted: true },
  { key: 'hdcp', shortLabel: 'Hcp', label: 'Hdcp', align: 'center', muted: true },
  { key: 'net', shortLabel: 'Net', label: 'Net', align: 'center' },
  { key: 'birdies', shortLabel: 'Brd', label: 'Birdies', align: 'center' },
  { key: 'points', shortLabel: 'Pts', label: 'Points', align: 'center' },
];

const SENECA_COLUMNS = [
  { key: 'rd1', shortLabel: 'R1', label: 'Round 1', align: 'center', muted: true },
  { key: 'rd2', shortLabel: 'R2', label: 'Round 2', align: 'center', muted: true },
  { key: 'total', shortLabel: 'Tot', label: 'Total', align: 'center' },
  { key: 'birdies', shortLabel: 'Brd', label: 'Birdies', align: 'center' },
  { key: 'points', shortLabel: 'Pts', label: 'Points', align: 'center' },
];

const defaultSortForView = (view) => {
  if (view) return { sortBy: 'points', sortDir: 'desc' };
  return { sortBy: 'avgNet', sortDir: 'asc' };
};

const compareValues = (a, b, sortBy, sortDir) => {
  const valA = a[sortBy];
  const valB = b[sortBy];
  const direction = sortDir === 'asc' ? 1 : -1;

  if (typeof valA === 'string' || typeof valB === 'string') {
    return direction * String(valA ?? '').localeCompare(String(valB ?? ''));
  }

  return direction * ((Number(valA) || 0) - (Number(valB) || 0));
};

export const AnalyticsTab = () => {
  const { data, loading, error, isStale, lastUpdated, isOnline, refreshing, reload } = useSheetData({
    url: SHEETS_URLS.stats,
    cacheKey: 'stats',
    parser: parseStatsCSV,
    fallbackData: { players: [], lowestNetRecord: null, lowestGrossRecord: null, mostBirdiesRecord: null, weekOptions: [], weeklyStatsByWeek: {} },
  });
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [sortBy, setSortBy] = useState('avgNet');
  const [sortDir, setSortDir] = useState('asc');

  const weekOptions = data?.weekOptions || [];
  const selectedWeekStats = selectedWeek === 'all' ? null : data?.weeklyStatsByWeek?.[selectedWeek];
  const analyticsData = useMemo(() => data?.players || [], [data]);
  const viewData = selectedWeekStats?.players || analyticsData;
  const columns = selectedWeekStats?.isMajor ? SENECA_COLUMNS : selectedWeekStats ? WEEK_COLUMNS : SEASON_COLUMNS;
  const gridTemplateColumns = selectedWeekStats ? '1.45fr repeat(5, 0.72fr)' : '1.35fr repeat(6, 0.68fr)';

  const sortedData = useMemo(() => [...viewData].sort((a, b) => {
    const primary = compareValues(a, b, sortBy, sortDir);
    if (primary !== 0) return primary;
    return String(a.player ?? '').localeCompare(String(b.player ?? ''));
  }), [viewData, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortDir(field === 'birdies' || field === 'avgPts' || field === 'points' ? 'desc' : 'asc');
    }
  };

  const handleWeekChange = (event) => {
    const nextWeek = event.target.value;
    const nextView = nextWeek === 'all' ? null : data?.weeklyStatsByWeek?.[nextWeek];
    const defaults = defaultSortForView(nextView);
    setSelectedWeek(nextWeek);
    setSortBy(defaults.sortBy);
    setSortDir(defaults.sortDir);
  };

  if (loading && analyticsData.length === 0) return <LoadingState label="Loading stats..." />;
  if (analyticsData.length === 0) return <ErrorState message={error || 'No stats available'} onRetry={reload} />;

  const tableTitle = selectedWeekStats ? `${selectedWeekStats.label} Scorecard` : 'All Weeks Averages';

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <DataBanner error={error} isStale={isStale} lastUpdated={lastUpdated} isOnline={isOnline} refreshing={refreshing} onRefresh={reload} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <SummaryCard title="Most Birdies" testId="stats-most-birdies-card" name={data?.mostBirdiesRecord?.player} score={data?.mostBirdiesRecord?.score} />
        <SummaryCard title="Lowest Net" testId="stats-lowest-net-card" name={data?.lowestNetRecord?.player} score={data?.lowestNetRecord?.score} />
        <SummaryCard title="Lowest Gross" testId="stats-lowest-gross-card" name={data?.lowestGrossRecord?.player} score={data?.lowestGrossRecord?.score} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Stats View</p>
          <div style={{ position: 'relative' }}>
            <select value={selectedWeek} onChange={handleWeekChange} style={{ appearance: 'none', WebkitAppearance: 'none', minWidth: 168, padding: '9px 34px 9px 12px', borderRadius: 999, border: `2px solid ${colors.green}`, background: colors.offWhite, color: colors.greenDark, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 0 rgba(31, 94, 59, 0.18)' }}>
              <option value="all">All Weeks</option>
              {weekOptions.map((week) => <option key={week.value} value={week.value}>{week.label}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: colors.green, pointerEvents: 'none', fontSize: 11 }}>▼</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: colors.textMuted, textAlign: 'right', maxWidth: 150, marginBottom: 2 }}>{tableTitle}</p>
      </div>

      <div role="table" aria-label={tableTitle} style={{ background: colors.offWhite, borderRadius: 16, overflow: 'hidden', border: `2px solid ${colors.green}` }}>
        <div role="row" style={{ display: 'grid', gridTemplateColumns, padding: '10px 10px', background: colors.green, borderBottom: `1px solid ${colors.greenDark}`, gap: 4 }}>
          <ColumnHeader active={sortBy === 'player'} label="Player" sortDir={sortDir} onClick={() => handleSort('player')} />
          {columns.map((col) => <ColumnHeader key={col.key} active={sortBy === col.key} label={col.shortLabel} accessibleLabel={col.label} align={col.align} sortDir={sortDir} onClick={() => handleSort(col.key)} />)}
        </div>
        {sortedData.map((player, idx) => (
          <div role="row" key={player.player} style={{ display: 'grid', gridTemplateColumns, padding: '10px 10px', borderBottom: idx < sortedData.length - 1 ? `1px solid ${colors.offWhiteMuted}` : 'none', background: idx % 2 === 0 ? 'transparent' : colors.offWhiteMuted, gap: 4, alignItems: 'center' }}>
            <div role="cell" style={{ fontSize: 13, color: colors.greenDark, fontWeight: 600 }}>{player.player}</div>
            {columns.map((col) => <Cell key={col.key} active={sortBy === col.key} muted={col.muted || (col.key === 'missedWeeks' && player.missedWeeks > 0)} value={player[col.key]} />)}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 16 }}>Choose a week, then tap column headers to sort</p>
    </div>
  );
};

const ColumnHeader = ({ active, label, accessibleLabel = label, align = 'left', sortDir, onClick }) => <div role="columnheader" aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} style={{ textAlign: align }}><button type="button" aria-label={`Sort by ${accessibleLabel}`} onClick={onClick} style={{ width: '100%', fontSize: 10, color: active ? colors.yellow : colors.offWhiteMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: align, cursor: 'pointer', fontWeight: active ? 700 : 500, background: 'transparent', border: 'none', padding: 0 }}>{label}</button></div>;
const SummaryCard = ({ title, testId, name, score }) => <div data-testid={testId} style={{ background: colors.green, borderRadius: 12, padding: 12, textAlign: 'center' }}><p style={{ fontSize: 10, color: colors.offWhiteMuted, textTransform: 'uppercase' }}>{title}</p><p style={{ fontSize: 16, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>{name || '--'}</p><p style={{ fontSize: 11, color: colors.offWhiteMuted }}>({score || '--'})</p></div>;
const Cell = ({ active, muted = false, value }) => <div role="cell" style={{ fontSize: 13, color: active ? colors.green : muted ? colors.textMuted : colors.greenDark, fontWeight: active ? 700 : 500, textAlign: 'center' }}>{value ?? 0}</div>;
