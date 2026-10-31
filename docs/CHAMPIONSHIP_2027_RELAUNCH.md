# Championship Mode: 2027 Relaunch Guide

Championship Mode was turned off for the 2026 off-season. All of its code is
still in the app; it only needs fresh 2027 content and the production switch
flipped back on. This guide is the full checklist, in order.

What Championship Mode does when it is on:

- The Championship splash (logo, sponsor, tagline) replaces the normal splash.
- The Championship tab replaces Schedule in the bottom navigation.
- The app opens on the Championship tab instead of Leaderboard.

The 2026 worksheet was archived in
`docs/championship-archive/2026/championship-sheet-2026.csv` before any reset.

## 1. Reset the Championship worksheet (Google Sheet)

The live app reads the `Championship` tab of the league Google Sheet
(range `Championship!A1:H1000`, served at `/api/sheets/championship`). Keep the
section titles and column headers exactly as they are; the parser finds each
section by its title.

1. `AWL CHAMPIONSHIP WEEKEND 2026` title: change to 2027.
2. `WEEKEND EVENTS`: new dates (M/D/YYYY), start times, venues, ceremony
   address and details.
3. `CHAMPIONSHIP RULES`: review every rule (Kevin Rule, strokes, tie, Birdie
   King pot) and update wording.
4. `GROUPINGS & TEE TIMES`: four groups of four golfers for 2027.
5. `WEEKEND HANDICAPS`: new Sat and Sun HDCP for every golfer.
6. `CHAMPIONSHIP LEADERBOARD`: clear every Round 1 / Round 2 / Weekend / Gross
   cell. Use `DNP` for a golfer who misses a day (their total becomes `DNF`).
7. `FINAL RESULTS`: clear the winners and scores; change the award label to
   `2027 AWL Champion`.
8. `MODE & NOTIFICATION CONTROLS`: set `Groupings Confirmed?` to `NO` until
   groupings are final, and `Championship Mode Ready?` to `NO` until Chad
   approves launch. Update the sponsor and push notification copy if needed.

## 2. Update year-specific strings and assets in the code

Every 2026-specific Championship item found in the codebase on 2026-10-31
(`grep -rn -i "2026\|aug 8\|aug 9\|fifth\|five years" src public e2e scripts`):

### Splash and Championship artwork

| What | File |
| --- | --- |
| 2026 logo image (dates are drawn into the art) | `public/awl-championship-2026.png` — add a new `awl-championship-2027.png` |
| Splash image path and alt text `Fifth Annual AWL Championship, August 8th and 9th, 2026` | `src/components/SplashScreen.jsx` (championship branch) |
| Splash tagline `Five years. Two rounds. One champion.` (2027 is the sixth) | `src/components/SplashScreen.jsx` |
| Championship tab image path and alt text | `src/tabs/ChampionshipTab.jsx` (logo header) |
| Championship tab tagline `Five years. Two rounds. One champion.` | `src/tabs/ChampionshipTab.jsx` |
| Schedule tab Championship card image path and alt text | `src/tabs/ScheduleTab.jsx` (`ChampionshipCard`) |
| Sponsor logo `anderson-heating-cooling.svg` and alt text (only if the sponsor changes) | `public/anderson-heating-cooling.svg`, `src/components/SplashScreen.jsx`, `src/tabs/ChampionshipTab.jsx` |
| Arrival copy `Everyone arrive around 6:00 AM` | `src/tabs/ChampionshipTab.jsx` |

### Hardcoded dates and venues

| What | File |
| --- | --- |
| Championship schedule row dates `Aug 8` / `Aug 9`, venues `Shawnee Hills` / `Pleasant Valley Country Club`, and `new Date(currentYear, 7, 8)` | `src/data/sheets.js` (`parseScheduleCSV`) |
| Seneca Open date `May 30` / `new Date(currentYear, 4, 30)` (same function; check it too) | `src/data/sheets.js` |
| Dev-only schedule preview card `Aug 8` / `Aug 9` and venues | `src/tabs/ScheduleTab.jsx` (`CHAMPIONSHIP_PREVIEW_GAME`) |
| Offline fallback events `8/8/2026`, `8/9/2026`, ceremony address, 2026 groupings | `src/data/championshipData.js` (`championshipFallback`) |
| Payout label `2026 AWL Champion` and amounts | `src/data/championshipData.js` (`championshipPayouts`) |
| Preview worksheet used by `?championshipPreview=1` | `public/championship-preview.csv` |
| Rules tab text `Aug 8th & 9th - Championship weekend ...` | `src/data/staticData.js` (rules, not `historicalData`) |
| Knowledge doc dates `August 8 at Shawnee Hills and August 9 at Pleasant Valley` | `docs/DEVIN_AWL_KNOWLEDGE.md` |

### Test fixtures (update alongside the code above)

| What | File |
| --- | --- |
| Championship CSV fixture `AWL CHAMPIONSHIP WEEKEND 2026`, `8/8/2026`, `8/9/2026`, `2026 AWL Champion` | `e2e/championship-mode.spec.js` |
| Schedule fixture `2026 SCHEDULE B`, `Championship Aug 8th and 9th`, asserts `Aug 8` / `Aug 9`, pinned test clock `new Date(2026, 7, 1, 12)` | `e2e/schedule-ui.spec.js` |
| Production flag assertion (expects `"false"` during the off-season; change to `"true"` in the launch PR) | `test/championshipLaunchConfig.test.js` |

## 3. Preview before launch

1. Open a branch and PR with the changes above. Do not change
   `netlify.toml` yet.
2. Locally: `VITE_CHAMPIONSHIP_MODE=true npm run dev`, or plain `npm run dev`
   and open `http://localhost:5173/?championshipPreview=1`.
3. On the Netlify deploy preview, open
   `https://deploy-preview-<PR number>--amwalkingleague.netlify.app/?championshipPreview=1`.
   The preview query is ignored on the production hostname.
4. Check the splash, Championship tab (schedule, leaderboard, groupings,
   rules, payouts), and that Leaderboard, Rules, History, and Stats still work.
5. Run `npm run check`.
6. Run the verifier against the live worksheet:
   `npm run verify:championship -- https://amwalkingleague.netlify.app`.
   It needs at least three events, four groups with 16 unique golfers, 16
   leaderboard rows, and `Groupings Confirmed?` = `YES`.

## 4. Flip the production switch

1. In `netlify.toml`, under `[context.production.environment]`, change
   `VITE_CHAMPIONSHIP_MODE = "false"` to `"true"`, and update
   `test/championshipLaunchConfig.test.js` to expect `"true"`.
2. Immediately before launch, Chad sets `Championship Mode Ready?` to `YES`,
   then run the verifier with `--require-ready`.
3. Merge and follow the "Timed launch" section of
   `docs/CHAMPIONSHIP_LAUNCH_RUNBOOK.md`.

Installed PWA clients pick up the change on their own: switching the flag
changes the built JavaScript bundle name, and `src/lib/appFreshness.js`
reloads the app when it sees a new bundle in `index.html`
(`public/sw.js` does not cache pages). No manual version bump is needed.

## 5. Off-season revert (after Championship Weekend)

This is the change that turned 2026 off (branch `devin/offseason-mode-switch`):

1. Archive the worksheet: save
   `https://amwalkingleague.netlify.app/api/sheets/championship` to
   `docs/championship-archive/<year>/championship-sheet-<year>.csv` with a
   short README.
2. Set `VITE_CHAMPIONSHIP_MODE = "false"` in `netlify.toml` and update
   `test/championshipLaunchConfig.test.js` to expect `"false"`.
3. Keep all Championship code, assets, tests, and the `?championshipPreview=1`
   path.
4. Run `npm run check`, merge, and confirm production shows the normal splash,
   Schedule in the bottom nav, no Championship tab, and opens on Leaderboard.
5. Record the official final results in the History tab data
   (`historicalData` in `src/data/staticData.js`).
