import {
  buildRoundPreview,
  buildSheetPlayerMaps,
  parseWeekColumnsFromSheetValues,
  resolveSheetName,
} from './scoreIngestion.js';

const pickFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

export const normalizeScorecardPlayers = (players = []) => players.map((player) => ({
  player: pickFirstDefined(player.player, player.name, player.displayName, player.birdiesName),
  rawScore: pickFirstDefined(player.rawScore, player.grossScore, player.gross, player.score),
  handicap: pickFirstDefined(player.handicap, player.courseHandicap, player.ch, player.CH),
  netScore: pickFirstDefined(player.netScore, player.net),
}));

export const buildBirdiesByPlayer = ({ players = [], aliasMap = {}, defaultBirdies = 0 } = {}) => players.reduce((map, player) => {
  const sourceName = pickFirstDefined(player.player, player.name, player.displayName, player.birdiesName);
  const sheetName = resolveSheetName(sourceName, aliasMap);
  const birdies = pickFirstDefined(player.birdies, player.birdieCount, defaultBirdies);
  if (sheetName) map[sheetName] = birdies;
  return map;
}, {});

export const buildScreenshotIngestionPreview = ({
  sheetValues,
  weekNumber,
  groupName,
  roster,
  extractedPlayers,
  defaultBirdies = 0,
  finalizeMissingPlayers = false,
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
    aliasMap,
    rowMap,
  });
};
