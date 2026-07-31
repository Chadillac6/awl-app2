import { parseChampionshipCSV } from '../src/data/sheets.js';

const baseUrl = String(process.argv[2] ?? 'https://amwalkingleague.netlify.app').replace(/\/$/, '');
const requireReady = process.argv.includes('--require-ready');
const expectedPlayers = 16;
const expectedGroups = 4;

const fail = (message) => {
  console.error(`Championship launch check failed: ${message}`);
  process.exitCode = 1;
};

const response = await fetch(`${baseUrl}/api/sheets/championship`, {
  headers: { Accept: 'text/csv,text/plain' },
  signal: AbortSignal.timeout(10_000),
});

if (!response.ok) {
  fail(`live worksheet returned HTTP ${response.status}`);
} else {
  const parsed = parseChampionshipCSV(await response.text());
  const uniquePlayers = new Set(parsed.groups.flatMap((group) => group.players.map((player) => player.trim().toLowerCase())));
  const controls = parsed.controls;

  if (parsed.events.length < 3) fail(`expected at least 3 events, found ${parsed.events.length}`);
  if (parsed.groups.length !== expectedGroups) fail(`expected ${expectedGroups} groups, found ${parsed.groups.length}`);
  if (uniquePlayers.size !== expectedPlayers) fail(`expected ${expectedPlayers} unique grouped players, found ${uniquePlayers.size}`);
  if (parsed.leaderboard.length !== expectedPlayers) fail(`expected ${expectedPlayers} leaderboard players, found ${parsed.leaderboard.length}`);
  if (controls['Groupings Confirmed?'] !== 'YES') fail('Groupings Confirmed? must be YES');
  if (requireReady && controls['Championship Mode Ready?'] !== 'YES') fail('Championship Mode Ready? must be YES');

  if (!process.exitCode) {
    console.log(JSON.stringify({
      baseUrl,
      events: parsed.events.length,
      groups: parsed.groups.length,
      groupedPlayers: uniquePlayers.size,
      leaderboardPlayers: parsed.leaderboard.length,
      groupingsConfirmed: controls['Groupings Confirmed?'],
      championshipModeReady: controls['Championship Mode Ready?'],
    }, null, 2));
  }
}
