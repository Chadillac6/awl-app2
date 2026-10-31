# Championship Mode Lifecycle Runbook

## Current release: regular app restored

`netlify.toml` sets `VITE_CHAMPIONSHIP_MODE="false"` in the production context.
This is a **build-time** Vite flag; a new successful deployment is required.
Changing the sheet readiness cell, URL, or an installed app's local storage does
not toggle production mode. Do not delete Championship code or revert unrelated
scoring, handicap, DNP/DNF, schedule, data-fetching, or app-freshness fixes.

The regular build restores the green AM Walking League splash, starts on
Leaderboard, and shows Schedule instead of the Championship navigation tab.
Leaderboard, Rules, History, and Stats remain available in either mode. Regular
Schedule cards, league rules, and historic results may still mention the
Championship: those are normal season content, not an active Championship mode.
No season reset, spreadsheet mutation, or result removal is part of this change.

### Activation and data audit

- `src/lib/championshipMode.js`: only the exact build value `true` enables
  Championship globally. The explicit `?championshipPreview=1` opt-in is allowed
  in Vite development or on `deploy-preview-<number>--amwalkingleague.netlify.app`.
  It cannot activate a disabled production build (including a locally served
  production bundle). Other branch-preview hosts are not allowlisted.
- `src/App.jsx`: the mode controls initial destination, splash, Championship
  rendering, and navigation. No persisted mode or active-tab state overrides it.
- `src/components/SplashScreen.jsx` and `AppChrome.jsx`: regular branding and
  Schedule return when disabled; Championship branding/navigation remain intact.
- `src/tabs/ChampionshipTab.jsx`: mounted only in enabled mode. Development
  preview uses `/championship-preview.csv`; built deploy previews and enabled
  production use `/api/sheets/championship`. Preview URLs are UI opt-ins, not
  data-write permission or synthetic-data guarantees.
- Shared sheet URLs, parsers, regular Schedule event cards, static season rules,
  history, and service-worker/app-freshness behavior are retained. Championship
  cache may remain on devices but is not read by the regular app's tabs.

## Review and deploy the regular restoration

1. Run `npm run check`; review the PR and Netlify deploy preview on iPhone.
2. Check Netlify environment overrides for `VITE_CHAMPIONSHIP_MODE`; the effective
   production build must use `false`. Never commit credentials or local env files.
3. Only after approval, merge the PR and wait for Netlify production to be ready.
4. Open the production app in a fresh browser and installed iPhone PWA, allow the
   app freshness check/reload, and verify the new deploy is actually loaded.
5. Confirm the regular splash, initial Leaderboard, Schedule tab, no Championship
   tab, and all five destinations. Confirm `?championshipPreview=1` cannot bypass
   the production flag. Check Schedule and leaderboard data still load normally.
6. No launch notification is implied or authorized by this restoration.

## Safe Championship preview

- Local: `npm run dev`, then open `/?championshipPreview=1`. It reads the bundled
  2026 preview CSV, not a new season's data.
- Netlify PR preview: append `?championshipPreview=1` to the approved deploy-preview
  URL. Normal mode remains the default. This built preview reads the worksheet
  endpoint; do not mistake old data/fallbacks for next-year readiness.
- No preview path writes to the sheet. Keep scoring and special-event decisions
  manual; regular-week ties still split automatically.

## Re-enable for a future Championship (Chad approval required)

Preserved 2026 content is **not** ready for next year just because the UI works.
Do not fabricate the next year's dates, courses, players, handicaps, sponsor,
awards, or payouts. Obtain and review approved details first.

1. On a new branch from current `main`, review all year-specific content:
   - `src/components/SplashScreen.jsx`, `src/tabs/ChampionshipTab.jsx`, and
     `public/awl-championship-2026.png`: artwork, alt text, edition/year, dates,
     tagline, sponsor branding and approvals.
   - `src/data/championshipData.js` and `public/championship-preview.csv`: fallback
     and preview dates, venues, ceremony, groups, handicaps, rules and payouts.
   - `src/data/staticData.js` and `src/data/sheets.js`: season rules and hardcoded
     regular Schedule special-event dates/course details; inspect rather than
     blindly replacing years or changing historical records.
   - Sheet-source/endpoint configuration (`src/data/sheetSources.js` and
     `netlify/functions/sheet-csv.js`): verify the intended season/worksheet.
2. Under separate authorization, prepare the correct worksheet: current events,
   confirmed groups/tee times and 16 unique players (or explicitly update the
   approved format and verifier), day-specific handicaps, manual scoring/status
   and rules, awards/results, readiness controls. Do not carry old final scores
   into a new event or erase historic data. Reset caches/version keys if the
   season transition requires it. This restoration does none of those writes.
3. Keep the production flag `false` while reviewing preview UI, fallback/offline
   content, Schedule, Leaderboard, groupings, rules and payouts. Review installed
   iPhone PWA and Safari, including stale-cache/update behavior.
4. Run `npm run check` and `npm run verify:championship -- <preview URL>`.
   The verifier checks endpoint structure, not the correctness of future dates,
   artwork, handicaps, payouts or scoring. Those require manual review.
5. Immediately before the approved launch, Chad authorizes setting worksheet
   `Championship Mode Ready?` to `YES`. Run the verifier with `--require-ready`.
6. Only after Chad explicitly approves launch, change the production-context
   `VITE_CHAMPIONSHIP_MODE` to `"true"` in a reviewed PR. Update the configuration
   regression test intentionally to reflect that approved launch. Check Netlify
   environment precedence and effective build value. Do not enable it globally
   for deploy previews.
7. After merge, wait for the production deploy to be ready; verify fresh browser
   and installed PWA show Championship splash and initial Championship page,
   Schedule replaced by Championship, current live endpoint data, and all other
   destinations. Run `npm run verify:championship -- <production URL> --require-ready`.
8. Only after every production check passes, send a separately approved launch
   announcement/notification.

## Regression coverage

`npm run check` includes lint, Node tests, development Playwright regressions,
production-bundle Playwright regressions, and the standard Vite build.

- Unit tests cover strict flag semantics, the preview host/query allowlist,
  production-disabled configuration, parsing, scoring, weekly tie splitting,
  birdie preservation and Championship DNP/DNF behavior.
- Existing mobile Chromium and three iPhone WebKit projects retain preview and
  normal app coverage.
- `e2e/production.config.js` builds isolated bundles with explicit `false` and
  `true` flags and serves them with DEV disabled. Mobile Chromium and iPhone
  WebKit test each with and without the preview query: splash, initial tab,
  navigation, live-vs-preview endpoint selection, DNF rendering and render errors.
  Regular mode makes no Championship data requests. All sheet responses in these
  new tests are mocked; the suite does not update live data.

## Rollback

If regular-restoration verification fails, an authorized operator can restore the
previous successful Netlify deploy immediately; note that the previous release
may re-enable the **2026 Championship** experience. For a permanent correction,
use a reviewed fix/revert PR and verify its effective mode before deploying. A
blanket revert can undo unrelated fixes: prefer a scoped change.

After a future Championship launch, the safe normal-mode rollback is a reviewed
PR setting production `VITE_CHAMPIONSHIP_MODE="false"` again, followed by a fresh
build/deploy and the regular-app checks above. A previously verified regular
Netlify deploy is the fastest emergency rollback. Neither path changes league
sheet data. Do not send launch notifications if verification fails.
