import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLeaderboardCSV, parseStatsCSV } from '../src/data/sheets.js';

test('parseLeaderboardCSV formats the Birdie King name and birdie count', () => {
  const csv = [
    ',,,Week,1,2',
    'Group A,,,Total',
    ',1,Chad,12,4,8',
    ',,,,Total Birdies:,71',
    ',,,,Birdie King:,,,Tony Anderson,12',
  ].join('\n');

  const parsed = parseLeaderboardCSV(csv);

  assert.equal(parsed.leagueStats.birdieLeader.raw, 'Tony Anderson');
  assert.equal(parsed.leagueStats.birdieLeader.name, 'Tony');
  assert.equal(parsed.leagueStats.birdieLeader.count, 12);
  assert.equal(parsed.leagueStats.birdieLeader.label, '12 Birdies');
});

test('parseLeaderboardCSV falls back to Many for long Birdie King names and em dash for blank count', () => {
  const csv = [
    ',,,Week,1,2',
    'Group A,,,Total',
    ',1,Chad,12,4,8',
    ',,,,Birdie King:,,,Tony Michael Lee Anderson,',
  ].join('\n');

  const parsed = parseLeaderboardCSV(csv);

  assert.equal(parsed.leagueStats.birdieLeader.name, 'Many');
  assert.equal(parsed.leagueStats.birdieLeader.count, null);
  assert.equal(parsed.leagueStats.birdieLeader.label, '—');
});

test('parseStatsCSV reads the player column next to Total Gross and keeps zero-placeholder rows', () => {
  const csv = [
    ',,,Total Gross,Avg Gross,Total Net,Avg Net,Avg Pts,Avg Hdcp,Birdies,Missed Week',
    ',,Chuck,45,45.0,35,35.0,2.0,19.0,0,',
    ',,Sean,0,#DIV/0!,0,#DIV/0!,0.0,#DIV/0!,0,',
    ',,Tony,42,42.0,34,34.0,4.0,16.0,1,',
  ].join('\n');

  const parsed = parseStatsCSV(csv);

  assert.deepEqual(parsed.players.map((player) => player.player), ['Chuck', 'Sean', 'Tony']);
  assert.equal(parsed.players[1].avgGross, 0);
  assert.equal(parsed.players[1].avgNet, 0);
  assert.equal(parsed.players[1].avgHdcp, 0);
  assert.equal(parsed.players[2].birdies, 1);
});
