import {
  buildRoundPreview,
  buildSheetPlayerMaps,
  coerceNumber,
  columnNameToNumber,
  normalizeName,
  parseWeekColumnsFromSheetValues,
  resolveSheetName,
} from './scoreIngestion.js';

const pickFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const pickRowOrder = (player = {}) => pickFirstDefined(
  player.rowOrder,
  player.rowIndex,
  player.rowNumber,
  player.ocrRow,
  player.lineIndex,
  player.sourceRow,
  player.y,
  player.top,
);

const sortByRowOrder = (players = []) => players
  .map((player, originalIndex) => ({ ...player, originalIndex }))
  .sort((a, b) => {
    const aRow = Number(a.rowOrder);
    const bRow = Number(b.rowOrder);
    const aHasRow = Number.isFinite(aRow);
    const bHasRow = Number.isFinite(bRow);

    if (aHasRow && bHasRow && aRow !== bRow) return aRow - bRow;
    if (aHasRow !== bHasRow) return aHasRow ? -1 : 1;
    return a.originalIndex - b.originalIndex;
  })
  .map((entry) => {
    const player = { ...entry };
    delete player.originalIndex;
    return player;
  });

export const normalizeScorecardPlayers = (players = []) => sortByRowOrder(players.map((player) => ({
  player: pickFirstDefined(player.player, player.name, player.displayName, player.birdiesName),
  rawScore: pickFirstDefined(player.rawScore, player.grossScore, player.gross, player.score),
  handicap: pickFirstDefined(player.handicap, player.courseHandicap, player.ch, player.CH),
  netScore: pickFirstDefined(player.netScore, player.net),
  rowOrder: pickRowOrder(player),
})));

export const buildBirdiesByPlayer = ({ players = [], aliasMap = {}, defaultBirdies = 0 } = {}) => players.reduce((map, player) => {
  const sourceName = pickFirstDefined(player.player, player.name, player.displayName, player.birdiesName);
  const sheetName = resolveSheetName(sourceName, aliasMap);
  const birdies = pickFirstDefined(player.birdies, player.birdieCount, defaultBirdies);
  if (sheetName) map[sheetName] = birdies;
  return map;
}, {});

const readCell = (row = [], columnName) => row[columnNameToNumber(columnName) - 1];

export const buildExistingWeekScorecardPlayers = ({
  sheetValues = [],
  weekNumber,
  roster = [],
  rowMap = {},
} = {}) => {
  const columns = parseWeekColumnsFromSheetValues(sheetValues, weekNumber);
  if (!columns) throw new Error(`Could not find complete week ${weekNumber} columns in sheet headers`);

  return roster.map((player, index) => {
    const rowNumber = rowMap[player] ?? (index + 3);
    const row = sheetValues[rowNumber - 1] ?? [];
    const rawScore = coerceNumber(readCell(row, columns.score));
    const handicap = coerceNumber(readCell(row, columns.handicap));
    const netScore = coerceNumber(readCell(row, columns.net));
    const birdies = coerceNumber(readCell(row, columns.birdies));

    return {
      player,
      rawScore,
      handicap,
      netScore,
      birdies,
      rowOrder: index + 1,
      source: 'sheet',
    };
  }).filter((player) => Number.isFinite(player.rawScore)
    || Number.isFinite(player.handicap)
    || Number.isFinite(player.netScore)
    || Number.isFinite(player.birdies));
};

export const mergeExistingAndExtractedScorecardPlayers = ({
  existingPlayers = [],
  extractedPlayers = [],
  aliasMap = {},
} = {}) => {
  const existingByPlayer = new Map();

  existingPlayers.forEach((player) => {
    const sheetName = resolveSheetName(player.player, aliasMap);
    const normalizedPlayer = { ...player, player: sheetName };
    const playerKey = normalizeName(sheetName);
    existingByPlayer.set(playerKey, normalizedPlayer);
  });

  const normalizedExtracted = extractedPlayers.map((player, index) => {
    const sourceName = pickFirstDefined(player.player, player.name, player.displayName, player.birdiesName);
    const sheetName = resolveSheetName(sourceName, aliasMap);
    const playerKey = normalizeName(sheetName);
    const existingPlayer = existingByPlayer.get(playerKey);
    const incomingBirdieValue = pickFirstDefined(player.birdies, player.birdieCount);
    const incomingBirdies = coerceNumber(incomingBirdieValue);
    return {
      ...player,
      player: sheetName,
      // Scorecard OCR may omit birdies even when the sheet already contains a
      // verified count. Preserve it unless the incoming payload explicitly
      // supplies a replacement (including zero).
      birdies: incomingBirdies ?? existingPlayer?.birdies,
      rowOrder: pickRowOrder(player) ?? (existingPlayers.length + index + 1),
      source: 'scorecard',
    };
  });

  const extractedKeys = new Set(normalizedExtracted.map((player) => normalizeName(player.player)));
  const untouchedExisting = [...existingByPlayer.entries()]
    .filter(([playerKey]) => !extractedKeys.has(playerKey))
    .map(([, player]) => player);

  // Keep every extracted row, including duplicates, so downstream validation
  // can surface duplicate submitted names instead of silently replacing one.
  return sortByRowOrder([...untouchedExisting, ...normalizedExtracted]);
};

export const buildScreenshotIngestionPreview = ({
  sheetValues,
  weekNumber,
  groupName,
  roster,
  extractedPlayers,
  defaultBirdies = 0,
  finalizeMissingPlayers = false,
  requireTieConfirmation = false,
} = {}) => {
  const { aliasMap, rowMap } = buildSheetPlayerMaps(sheetValues);
  const columns = parseWeekColumnsFromSheetValues(sheetValues, weekNumber);

  if (!columns) throw new Error(`Could not find complete week ${weekNumber} columns in sheet headers`);

  const submittedScores = normalizeScorecardPlayers(extractedPlayers);
  const birdiesByPlayer = buildBirdiesByPlayer({ players: extractedPlayers, aliasMap, defaultBirdies });

  return buildRoundPreview({
    weekNumber,
    columns,
    groupName,
    roster,
    submittedScores,
    birdiesByPlayer,
    finalizeMissingPlayers,
    requireTieConfirmation,
    aliasMap,
    rowMap,
  });
};
