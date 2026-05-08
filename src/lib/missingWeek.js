import {
  buildSheetPlayerMaps,
  parseWeekColumnsFromSheetValues,
  resolveSheetName,
} from './scoreIngestion.js';

export const SOFT_RED = { red: 1, green: 0.85, blue: 0.85 };

const columnNameToNumber = (columnName) => String(columnName)
  .toUpperCase()
  .split('')
  .reduce((total, char) => (total * 26) + (char.charCodeAt(0) - 64), 0);

export const buildMissingWeekPlan = ({
  sheetValues,
  weekNumber,
  playerName,
  tab = 'Raw',
  sheetId,
  fillColor = SOFT_RED,
} = {}) => {
  if (!sheetValues) throw new Error('sheetValues are required');
  if (!weekNumber) throw new Error('weekNumber is required');
  if (!playerName) throw new Error('playerName is required');

  const { aliasMap, rowMap } = buildSheetPlayerMaps(sheetValues);
  const sheetName = resolveSheetName(playerName, aliasMap);
  const rowNumber = rowMap[sheetName];
  const columns = parseWeekColumnsFromSheetValues(sheetValues, weekNumber);

  if (!rowNumber) throw new Error(`Could not map missing player ${playerName} to a Raw sheet row`);
  if (!columns) throw new Error(`Could not find complete week ${weekNumber} columns in sheet headers`);

  const range = `${tab}!${columns.score}${rowNumber}:${columns.points}${rowNumber}`;
  const values = [['', '', '', 0, 0]];
  const formatRequest = sheetId ? {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: rowNumber - 1,
        endRowIndex: rowNumber,
        startColumnIndex: columnNameToNumber(columns.score) - 1,
        endColumnIndex: columnNameToNumber(columns.points),
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: fillColor,
        },
      },
      fields: 'userEnteredFormat.backgroundColor',
    },
  } : null;

  return {
    playerName,
    sheetName,
    weekNumber,
    rowNumber,
    columns,
    range,
    values,
    formatRequest,
    summary: {
      score: 'blank',
      handicap: 'blank',
      net: 'blank',
      birdies: 0,
      points: 0,
      highlight: 'soft red',
    },
  };
};
