import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLeaderboardCSV } from '../src/data/sheets.js';

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
