const DEFAULT_POINT_SLOTS = [4, 2, 1, 0];

export const DEFAULT_GROUPS = {
  group1: ['Chuck', 'Chad', 'Carp', 'Glen'],
  group2: ['Sean', 'Jake', 'Jimmy', 'Faro'],
  group3: ['Joey', 'Basar', 'Baker', 'Andulics'],
  group4: ['Tony', 'Josh', 'Jared', 'Ian'],
};

export const normalizeName = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/['’.]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const coerceNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value ?? '').trim();
  if (text === '') return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};

export const buildAliasMap = (rows = []) => rows.reduce((map, row) => {
  const birdiesName = normalizeName(row?.birdiesName ?? row?.birdies ?? row?.alias ?? row?.[0]);
  const sheetName = String(row?.sheetName ?? row?.sheet ?? row?.player ?? row?.[1] ?? '').trim();

  if (birdiesName && sheetName) map[birdiesName] = sheetName;
  return map;
}, {});

export const buildRowMap = (rows = []) => rows.reduce((map, row, index) => {
  const sheetName = String(row?.sheetName ?? row?.sheet ?? row?.player ?? row?.[1] ?? '').trim();
  const explicitRowNumber = coerceNumber(row?.rowNumber ?? row?.row ?? row?.[2]);
  const rowNumber = explicitRowNumber ?? (index + 3);

  if (sheetName && Number.isFinite(rowNumber)) map[sheetName] = rowNumber;
  return map;
}, {});

export const buildSheetPlayerMaps = (sheetValues = [], options = {}) => {
  const { startRow = 3, endRow = 21 } = options;
  const rows = [];

  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheetValues[rowNumber - 1] ?? [];
    const birdiesName = String(row[0] ?? '').trim();
    const sheetName = String(row[1] ?? '').trim();
    if (!birdiesName || !sheetName) continue;
    rows.push({ birdiesName, sheetName, rowNumber });
  }

  return {
    rows,
    aliasMap: buildAliasMap(rows),
    rowMap: buildRowMap(rows),
  };
};

export const resolveSheetName = (sourceName, aliasMap = {}) => {
  const normalized = normalizeName(sourceName);
  return aliasMap[normalized] ?? sourceName;
};

const columnNumberToName = (columnNumber) => {
  let current = columnNumber;
  let name = '';

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
};

const columnNameToNumber = (columnName) => String(columnName)
  .toUpperCase()
  .split('')
  .reduce((total, char) => (total * 26) + (char.charCodeAt(0) - 64), 0);

export const weekIndexToColumns = (weekIndex, baseColumn = 'D') => {
  const baseColumnNumber = columnNameToNumber(baseColumn);
  const offset = weekIndex * 5;
  const score = columnNumberToName(baseColumnNumber + offset);
  const handicap = columnNumberToName(baseColumnNumber + offset + 1);
  const net = columnNumberToName(baseColumnNumber + offset + 2);
  const birdies = columnNumberToName(baseColumnNumber + offset + 3);
  const points = columnNumberToName(baseColumnNumber + offset + 4);
  return { score, handicap, net, birdies, points };
};

const normalizeHeader = (value) => normalizeName(value).replace(/pts.*/, 'points');

export const parseWeekColumnsFromSheetValues = (sheetValues = [], weekNumber) => {
  const weekRow = sheetValues[0] ?? [];
  const headerRow = sheetValues[1] ?? [];
  const weekText = String(weekNumber);
  const startIndex = weekRow.findIndex((cell) => String(cell ?? '').trim() === weekText);

  if (startIndex === -1) return null;

  const columns = {};
  for (let index = startIndex; index < Math.min(startIndex + 5, headerRow.length); index += 1) {
    const header = normalizeHeader(headerRow[index]);
    const columnName = columnNumberToName(index + 1);
    if (header === 'score') columns.score = columnName;
    else if (header === 'hdcp' || header === 'handicap') columns.handicap = columnName;
    else if (header === 'net') columns.net = columnName;
    else if (header === 'birdies') columns.birdies = columnName;
    else if (header === 'points') columns.points = columnName;
  }

  return ['score', 'handicap', 'net', 'birdies', 'points'].every((key) => columns[key]) ? columns : null;
};

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const withOriginalIndex = (entries) => entries.map((entry, index) => ({ ...entry, originalIndex: index }));

const normalizeSubmittedEntry = (entry, aliasMap = {}) => {
  const player = String(entry?.player ?? '').trim();
  const resolvedPlayer = resolveSheetName(player, aliasMap);

  return {
    ...entry,
    sourcePlayer: player,
    player: resolvedPlayer,
    rawScore: coerceNumber(entry?.rawScore),
    handicap: coerceNumber(entry?.handicap),
    netScore: coerceNumber(entry?.netScore),
    playerKey: normalizeName(resolvedPlayer),
  };
};

export const scoreSubmittedPlayers = (entries, options = {}) => {
  const {
    pointSlots = DEFAULT_POINT_SLOTS,
    requireTieConfirmation = true,
  } = options;

  const submitted = withOriginalIndex(entries.map((entry) => normalizeSubmittedEntry(entry, options.aliasMap)))
    .filter((entry) => Number.isFinite(entry?.netScore))
    .sort((a, b) => a.netScore - b.netScore || String(a.player).localeCompare(String(b.player)));

  const scored = [];
  let cursor = 0;
  let hasTie = false;

  while (cursor < submitted.length) {
    const tied = [submitted[cursor]];
    let next = cursor + 1;

    while (next < submitted.length && submitted[next].netScore === submitted[cursor].netScore) {
      tied.push(submitted[next]);
      next += 1;
    }

    const pointsWindow = pointSlots.slice(cursor, cursor + tied.length);
    const awardedPoints = pointsWindow.length ? average(pointsWindow) : 0;
    if (tied.length > 1) hasTie = true;

    tied.forEach((entry) => {
      scored.push({
        ...entry,
        points: awardedPoints,
        tie: tied.length > 1,
        tieSize: tied.length,
      });
    });

    cursor = next;
  }

  scored.sort((a, b) => a.originalIndex - b.originalIndex);

  return {
    scored,
    hasTie,
    requiresTieConfirmation: requireTieConfirmation && hasTie,
  };
};

export const buildGroupScoreState = ({
  groupName,
  roster = [],
  submittedScores = [],
  finalizeMissingPlayers = false,
  requireTieConfirmation = true,
  aliasMap = {},
} = {}) => {
  const normalizedSubmitted = submittedScores.map((entry) => normalizeSubmittedEntry(entry, aliasMap));
  const issues = {
    unmatchedSubmittedScores: [],
    duplicateSubmittedNames: [],
    invalidNumericInputs: [],
  };

  const rosterKeys = new Set(roster.map((player) => normalizeName(player)));
  const submittedByKey = new Map();
  normalizedSubmitted.forEach((entry) => {
    if (!entry.playerKey || !rosterKeys.has(entry.playerKey)) {
      issues.unmatchedSubmittedScores.push(entry);
    }

    if (!Number.isFinite(entry.netScore) || !Number.isFinite(entry.rawScore) || !Number.isFinite(entry.handicap)) {
      issues.invalidNumericInputs.push(entry);
    }

    if (submittedByKey.has(entry.playerKey)) {
      issues.duplicateSubmittedNames.push([submittedByKey.get(entry.playerKey), entry]);
      return;
    }

    submittedByKey.set(entry.playerKey, entry);
  });

  const mappedEntries = roster.map((player) => {
    const match = submittedByKey.get(normalizeName(player));
    return match
      ? { ...match, player }
      : { player, status: finalizeMissingPlayers ? 'missing-final' : 'pending' };
  });

  const { scored, hasTie, requiresTieConfirmation } = scoreSubmittedPlayers(mappedEntries, {
    requireTieConfirmation,
  });
  const scoredMap = Object.fromEntries(scored.map((entry) => [entry.player, entry]));

  const players = mappedEntries.map((entry) => {
    if (scoredMap[entry.player]) return { ...entry, ...scoredMap[entry.player], status: 'scored' };
    if (finalizeMissingPlayers) return { ...entry, points: 0, status: 'missing-final' };
    return { ...entry, points: null, status: 'pending' };
  });

  return {
    groupName,
    submittedCount: scored.length,
    missingCount: Math.max(roster.length - scored.length, 0),
    hasTie,
    requiresTieConfirmation,
    issues,
    players,
  };
};

export const buildWritePlan = ({
  weekIndex,
  weekNumber,
  columns: explicitColumns,
  startRow = 3,
  roster,
  submittedScores,
  birdiesByPlayer = {},
  finalizeMissingPlayers = false,
  groupName,
  aliasMap = {},
  rowMap = {},
} = {}) => {
  const columns = explicitColumns ?? weekIndexToColumns(weekIndex ?? ((weekNumber ?? 1) - 1));
  const group = buildGroupScoreState({
    groupName,
    roster,
    submittedScores,
    finalizeMissingPlayers,
    aliasMap,
  });

  return {
    weekIndex: weekIndex ?? ((weekNumber ?? 1) - 1),
    weekNumber: weekNumber ?? ((weekIndex ?? 0) + 1),
    columns,
    group,
    rows: group.players.map((player, index) => {
      const rowNumber = rowMap[player.player] ?? (startRow + index);
      const values = {
        score: player.rawScore ?? null,
        handicap: player.handicap ?? null,
        net: player.netScore ?? null,
        birdies: birdiesByPlayer[player.player] ?? null,
        points: player.points ?? null,
      };
      return {
        rowNumber,
        player: player.player,
        cells: {
          score: `${columns.score}${rowNumber}`,
          handicap: `${columns.handicap}${rowNumber}`,
          net: `${columns.net}${rowNumber}`,
          birdies: `${columns.birdies}${rowNumber}`,
          points: `${columns.points}${rowNumber}`,
        },
        values,
        rawScore: values.score,
        handicap: values.handicap,
        netScore: values.net,
        birdies: values.birdies,
        points: values.points,
        status: player.status,
      };
    }),
  };
};

export const buildRoundPreview = ({
  weekIndex,
  weekNumber,
  columns,
  roster,
  submittedScores,
  birdiesByPlayer = {},
  finalizeMissingPlayers = false,
  groupName,
  aliasMap = {},
  rowMap = {},
} = {}) => buildWritePlan({
  weekIndex,
  weekNumber,
  columns,
  roster,
  submittedScores,
  birdiesByPlayer,
  finalizeMissingPlayers,
  groupName,
  aliasMap,
  rowMap,
});
