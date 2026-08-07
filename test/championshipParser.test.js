import assert from 'node:assert/strict';
import test from 'node:test';
import { parseChampionshipCSV } from '../src/data/sheets.js';

const championshipCsv = [
  'AWL CHAMPIONSHIP WEEKEND 2026',
  '',
  '',
  'WEEKEND EVENTS',
  'Event,Date,Start Time,Course / Venue,Address,Details',
  'Round One,8/8/2026,6:00 AM,Shawnee Hills,,',
  'Final Round,8/9/2026,6:00 AM,Pleasant Valley Country Club,,',
  'AWL Awards Ceremony,8/9/2026,1:30 PM,Awards Ceremony,"13489 Lake Avenue, Lakewood, Ohio","Groups A & B: Bring appetizers · Groups C & D: Bring desserts"',
  '',
  'CHAMPIONSHIP RULES',
  'Rule #,Rule Name,Full Rule / Change',
  '1,The Kevin Rule,No gimmies for birdies.',
  '2,Out of Bounds,Played as a red stake.',
  '',
  'GROUPINGS & TEE TIMES',
  'Group,Tee Time,Player 1,Player 2,Player 3,Player 4,Notes',
  'Group 1,,Chuck,Sean,Fitch,Ian,',
  'Group 2,,Jimmy,Andulics,Tony,Glen,',
  'Group 3,,Baker,Houser,Chad,Faro,',
  'Group 4,,Jared,Carp,Jake,Basar,',
  '',
  'WEEKEND HANDICAPS',
  'Player,Sat HDCP,Sun HDCP',
  'Chuck,14,13',
  'Sean,10,9',
  'Fitch,,',
  'Ian,18,17',
  '',
  'CHAMPIONSHIP LEADERBOARD',
  'Position,Player,Group,Round 1 Net,Round 2 Net,Weekend Net,Gross Total,Status / Notes',
  ',Chuck,Group 1,74,70,144,160,',
  ',Sean,Group 1,68,69,137,151,',
  ',Fitch,Group 1,,,,,,',
  ',Ian,Group 1,DNP,72,DNF,,Did not play Saturday',
  ',Andulics,Group 2,73,DNP,#VALUE!,,Did not play Sunday',
  '',
  'FINAL RESULTS',
  'Award,Winner,Final Score,Notes',
  '2026 AWL Champion,,,',
  '',
  'MODE & NOTIFICATION CONTROLS',
  'Setting,Value,Instructions / Copy',
  'Groupings Confirmed?,YES,',
  'Championship Mode Ready?,NO,',
].join('\n');

test('championship parser extracts all page sections and sorts lowest net first', () => {
  const parsed = parseChampionshipCSV(championshipCsv);

  assert.equal(parsed.events.length, 3);
  assert.equal(parsed.events[1].venue, 'Pleasant Valley Country Club');
  assert.equal(parsed.events[1].time, '6:00 AM');
  assert.equal(parsed.events[2].address, '13489 Lake Avenue, Lakewood, Ohio');
  assert.equal(parsed.events[2].details, 'Groups A & B: Bring appetizers · Groups C & D: Bring desserts');
  assert.equal(parsed.rules.length, 2);
  assert.equal(parsed.groups.length, 4);
  assert.deepEqual(parsed.groups[0].players, ['Chuck', 'Sean', 'Fitch', 'Ian']);
  assert.deepEqual(parsed.groups[0].handicaps.Chuck, { round1: 14, round2: 13 });
  assert.deepEqual(parsed.groups[0].handicaps.Fitch, { round1: null, round2: null });
  assert.deepEqual(parsed.leaderboard.map((player) => player.name), ['Sean', 'Chuck', 'Fitch', 'Andulics', 'Ian']);
  assert.equal(parsed.leaderboard.some((player) => player.name === 'Winner'), false);
  assert.equal(parsed.leaderboard[0].weekendNet, 137);
  assert.deepEqual(parsed.leaderboard.slice(-2).map((player) => [player.name, player.weekendNet]), [
    ['Andulics', 'DNF'],
    ['Ian', 'DNF'],
  ]);
  assert.equal(parsed.leaderboard.find((player) => player.name === 'Ian').round1Net, 'DNP');
  assert.equal(parsed.controls['Groupings Confirmed?'], 'YES');
  assert.equal(parsed.controls['Championship Mode Ready?'], 'NO');
});

test('championship handicap parsing stops at the next known section without a leaderboard', () => {
  const withoutLeaderboard = championshipCsv.replace(
    /CHAMPIONSHIP LEADERBOARD[\s\S]*?(?=FINAL RESULTS)/,
    '',
  );
  const parsed = parseChampionshipCSV(withoutLeaderboard);

  assert.deepEqual(parsed.groups[0].handicaps.Chuck, { round1: 14, round2: 13 });
  assert.equal(parsed.groups[0].handicaps['FINAL RESULTS'], undefined);
  assert.equal(parsed.controls['Championship Mode Ready?'], 'NO');
});

test('championship parser never turns unrelated worksheet rows into group cards', () => {
  const withoutHandicapLabel = championshipCsv.replace('WEEKEND HANDICAPS\n', '');
  const parsed = parseChampionshipCSV(withoutHandicapLabel);

  assert.deepEqual(parsed.groups.map((group) => group.name), ['Group 1', 'Group 2', 'Group 3', 'Group 4']);
  assert.equal(parsed.groups.some((group) => group.name === 'Player' || group.name === 'Chuck'), false);
});
