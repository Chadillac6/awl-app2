import { getSpreadsheetValues, updateSpreadsheetValues } from './googleSheetsBatch.js';
import { coerceNumber } from './scoreIngestion.js';

const RAW_RANGE = 'Raw!A1:ZZ23';
const LEADERBOARD_BIRDIE_STATS_RANGE = 'Leaderboards!H26:O26';

const normalizeHeader = (value) => String(value ?? '').trim().toLowerCase();

export const findBirdieColumns = (headerRow = []) => headerRow
  .map((header, index) => ({ header: normalizeHeader(header), index }))
  .filter(({ header }) => header === 'birdies' || header === 'b')
  .map(({ index }) => index);

const formatLeaderNames = (names = []) => {
  if (names.length === 0) return '—';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`;
};

export const calculateBirdieKing = (rawValues = []) => {
  const headerRow = rawValues[1] ?? [];
  const birdieColumns = findBirdieColumns(headerRow);
  const playerRows = rawValues.slice(2, 21).filter((row) => String(row?.[1] ?? '').trim());

  const players = playerRows.map((row) => {
    const player = String(row[1] ?? '').trim();
    const birdies = birdieColumns.reduce((total, colIndex) => total + (coerceNumber(row[colIndex]) ?? 0), 0);
    return { player, birdies };
  });

  const maxBirdies = players.reduce((max, player) => Math.max(max, player.birdies), 0);
  const leaders = maxBirdies > 0 ? players.filter((player) => player.birdies === maxBirdies).map((player) => player.player) : [];
  const totalBirdies = players.reduce((total, player) => total + player.birdies, 0);

  return {
    totalBirdies,
    maxBirdies,
    leaders,
    leaderLabel: formatLeaderNames(leaders),
    players,
    birdieColumns,
  };
};

export const updateLeaderboardBirdieKing = async ({
  spreadsheetId,
  rawRange = RAW_RANGE,
  leaderboardRange = LEADERBOARD_BIRDIE_STATS_RANGE,
} = {}) => {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');

  const raw = await getSpreadsheetValues({ spreadsheetId, range: rawRange });
  const stats = calculateBirdieKing(raw.values ?? []);

  await updateSpreadsheetValues({
    spreadsheetId,
    range: leaderboardRange,
    values: [[stats.totalBirdies, '', 'Birdie King:', '', '', stats.leaderLabel, '', stats.maxBirdies]],
  });

  return {
    range: leaderboardRange,
    totalBirdies: stats.totalBirdies,
    leaderLabel: stats.leaderLabel,
    maxBirdies: stats.maxBirdies,
    leaders: stats.leaders,
  };
};
