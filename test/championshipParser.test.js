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
  'Final Round,8/9/2026,6:00 AM,Shale Creek,,',
  'AWL Awards Ceremony,8/9/2026,1:30 PM,Awards Ceremony,"13489 Lake Avenue, Lakewood, Ohio",',
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
  'CHAMPIONSHIP LEADERBOARD',
  'Position,Player,Group,Round 1 Net,Round 2 Net,Weekend Net,Gross Total,Status / Notes',
  ',Chuck,Group 1,74,70,144,160,',
  ',Sean,Group 1,68,69,137,151,',
  ',Fitch,Group 1,,,,,,',
  '',
  'MODE & NOTIFICATION CONTROLS',
  'Setting,Value,Instructions / Copy',
  'Groupings Confirmed?,YES,',
  'Championship Mode Ready?,NO,',
].join('\n');

test('championship parser extracts all page sections and sorts lowest net first', () => {
  const parsed = parseChampionshipCSV(championshipCsv);

  assert.equal(parsed.events.length, 3);
  assert.equal(parsed.events[2].address, '13489 Lake Avenue, Lakewood, Ohio');
  assert.equal(parsed.rules.length, 2);
  assert.equal(parsed.groups.length, 4);
  assert.deepEqual(parsed.groups[0].players, ['Chuck', 'Sean', 'Fitch', 'Ian']);
  assert.deepEqual(parsed.leaderboard.map((player) => player.name), ['Sean', 'Chuck', 'Fitch']);
  assert.equal(parsed.leaderboard[0].weekendNet, 137);
  assert.equal(parsed.controls['Groupings Confirmed?'], 'YES');
  assert.equal(parsed.controls['Championship Mode Ready?'], 'NO');
});
