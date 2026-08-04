# AM Walking League (AWL) — Devin Knowledge and Engineering Playbook

Last updated: July 31, 2026

This file is the durable product and engineering context for anyone using Devin
to review or change the AWL application. Read it before proposing changes,
reviewing a pull request, or interpreting behavior as a bug.

## 1. Authority and decision order

When instructions conflict, use this order:

1. Chad Supers's explicit request for the current task.
2. The product invariants in this document and `docs/AWL_DOMAIN_RULES.md`.
3. Existing automated tests and established code behavior.
4. Generic golf conventions or reviewer assumptions.

Do not replace an AWL-specific rule with a more conventional golf rule unless
Chad explicitly changes it. If a rule is unclear, flag it for Chad instead of
guessing. Championship and special-event scoring is always manual.

## 2. Product summary

AWL is a mobile-first progressive web app for a 16-player outdoor walking golf
league in the Cleveland, Ohio area. The live app is:

- Production: https://amwalkingleague.netlify.app/
- GitHub: https://github.com/Chadillac6/awl-app2
- Hosting and serverless functions: Netlify
- Operational data source: Google Sheets
- Scorecard source: screenshots from the 18Birdies app

The app presents live standings, schedule, weekly and season statistics, rules,
history, push-notification enrollment, and a feature-flagged Championship Mode.
It is a public read-only experience. Administrative score and sheet operations
run through scripts and protected service credentials, not public app controls.

The league is walking-only. Do not introduce cart assumptions or exceptions.

## 3. Current league structure

The regular season has 16 golfers in four fixed four-player groups. These names
are the canonical short names used by the Raw sheet and application logic.

### Group A / `group1`

- Chuck
- Chad
- Carp
- Glen

### Group B / `group2`

- Sean
- Jake
- Jimmy
- Faro

### Group C / `group3`

- Joey
- Basar
- Baker
- Andulics

Jim Basar is the 2026-only replacement in Group C.

### Group D / `group4`

- Tony
- Josh
- Jared
- Ian

The Raw sheet stores an 18Birdies display-name alias in column A and the
canonical spreadsheet name in column B. Name matching must be punctuation- and
case-tolerant and must resolve through the live alias map. Do not hard-code a
new alias when the sheet can provide it.

Championship groupings are separate from the fixed regular-season groups. They
come from the Championship worksheet and may change until Chad confirms them.

## 4. 2026 season structure

- Regular season: 12 weekly rounds, May 1 through July 31.
- Seneca Open major: May 30, 27 holes, all 16 golfers together.
- Championship Weekend: August 8 at Shawnee Hills and August 9 at Pleasant Valley Country Club.
- Awards ceremony: August 9 at 1:30 PM.

Dates, venues, event copy, Championship groupings, and Championship rules should
be read from the live worksheets wherever the app already supports that. Do not
duplicate sheet-owned content in code without a deliberate offline fallback.

## 5. Regular-week scoring invariants

These behaviors are intentional and must not be “fixed” by a reviewer.

### Net score

- 18Birdies screenshots show gross scores.
- AWL net score is gross minus the player's handicap strokes for the round.
- If hole-level calculation is needed, strokes go to the hardest indexed holes
  first; a scorecard HANDICAP row is the hole stroke index, where 1 is hardest.
- Never guess a score, handicap, or missing hole value.

### Weekly points

- Each four-player regular-season group awards 4, 2, 1, and 0 points by net
  finish.
- Lower net is better.
- Players who did not play receive 0 points.

### Ties — critical intentional behavior

- Normal weekly ties automatically split the occupied point slots equally.
- No confirmation from Chad is required for a normal weekly tie.
- Example: two players tied for first receive `(4 + 2) / 2 = 3` points each.
- Example: two players tied for second receive `(2 + 1) / 2 = 1.5` each.
- Tie confirmation exists only as an explicit opt-in for exceptional/manual
  events. Do not make confirmation the default.

The implementation lives primarily in `src/lib/scoreIngestion.js`. Tests must
continue proving both automatic regular-week splits and explicit opt-in gating.

### Missing week

When Chad says a golfer did not play:

- Score, handicap, and net remain blank.
- Birdies is explicitly 0.
- Points is explicitly 0.
- The full five-cell weekly block is highlighted soft red.
- The player must not be treated as a zero-net scorer.

Use `scripts/mark-missing-week.mjs` and preview before applying.

### Birdies

- A completed round with no birdies stores an explicit 0, not a blank.
- Re-ingesting a scorecard that omits birdie data must preserve a verified
  birdie count already stored in the sheet.
- An explicit incoming birdie value, including zero, replaces the old value.
- Birdie preservation must never backfill stale gross, handicap, or net values
  when the incoming score extraction is incomplete.
- The Birdie King summary is recalculated from Raw birdie columns.

## 6. Special-event scoring

Do not apply regular-week automation to these events unless Chad gives exact
instructions.

### Seneca Open

- Format: 9 holes two-man scramble, 9 holes team net stroke play, and 9 holes
  alternate shot.
- All 16 golfers are ranked together.
- Points begin at 6 for first and extend through the event-specific placements.
- Tiebreaker is a putt-off unless Chad specifies otherwise.
- The Raw sheet's Major block differs from a regular five-column week and must
  be detected from its headers rather than treated as a normal week.

### Championship Weekend

- Championship scoring is manual.
- Round-one starting adjustments are controlled by the Championship rules in
  the worksheet and must not be inferred from regular-week point logic.
- The Championship leaderboard sorts lowest total net to the top.
- Gross champion is tracked separately.
- Final results are not automatically written into History; Chad updates the
  History tab after the event.

## 7. Google Sheets architecture

The application reads one active 2026 workbook. Never commit service-account
credentials or paste secret values into issues, pull requests, logs, or docs.

Primary tabs:

- `Raw`: player aliases, weekly gross/handicap/net/birdies/points, Major block,
  and derived season statistics.
- `Leaderboards`: four regular-season standings blocks and league summary data.
- `Schedule`: regular rounds, Seneca Open, and Championship schedule entries.
- `Rules`: league rules displayed in the app.
- `Directory`: player directory data.
- `History`: historical winners and event records.
- `Championship`: Championship events, rules, groupings, live leaderboard,
  results placeholders, sponsor, mode readiness, and notification copy.

### Read path

The browser requests same-origin endpoints:

- `/api/sheets/leaderboard`
- `/api/sheets/schedule`
- `/api/sheets/stats`
- `/api/sheets/championship`

Netlify redirects these to `netlify/functions/sheet-csv.js`. The function uses
Google service-account authentication when configured and has published CSV
fallbacks for the ordinary public tabs. Championship requires the live service
account path, so its endpoint must return HTTP 200 before launch.

The browser has retry, cache, stale-data, and fallback behavior. Do not mistake a
successful fallback render for proof that the live worksheet endpoint works.
Production readiness must test the endpoint itself.

### Write path

Operational scripts use the direct Google Sheets API helpers and service account:

- `scripts/ingest-scorecard.mjs`
- `scripts/mark-missing-week.mjs`
- `scripts/sort-leaderboards.mjs`
- `scripts/update-birdie-king.mjs`
- `scripts/send-leaderboard-notification.mjs`

All destructive or score-changing commands should support and use preview mode
before `--apply`. Do not restore legacy OAuth or Apps Script write paths when the
direct service-account path already exists.

### Weekly Raw layout

- Regular weeks are five-column blocks: Score, Hdcp, Net, Birdies, Pts.
- Code should discover the week and headers from the live first two rows.
- Do not assume every event block is five columns; Major is structurally
  different.
- Blank numeric cells are missing values, not numeric zero.

## 8. Scorecard ingestion safety

18Birdies screenshots are OCR-like structured inputs. The critical safety rules
are:

- Resolve source names through the alias map.
- Preserve OCR row ordering when row hints are supplied.
- For multi-player extraction, require row hints by default so scores cannot be
  attached to the wrong golfer.
- Reject or surface duplicate names, unmatched names, and invalid numeric data.
- Merge already submitted players so group points can be recalculated as later
  scorecards arrive.
- Do not finalize absent players as missing unless explicitly instructed.
- Preview exact target cells and values before writing.
- Never guess missing scorecard values.
- Sort the full leaderboard row blocks after point updates so names, totals, and
  weekly values stay together.

## 9. Frontend architecture and design intent

The app is a React 19 and Vite 7 tab-based SPA without a routing or component
library. It is designed first for installed iPhone PWA use.

Primary normal-mode tabs:

- Leaderboard
- Schedule
- Rules
- History
- Stats

Important UI constraints:

- Preserve iPhone safe-area behavior and the continuous green app-shell edge.
- Keep bottom navigation accessible and expose selected/expanded state.
- The leaderboard's Rank, Player, and Total columns remain sticky during
  horizontal scrolling.
- Reuse the existing `SunLogo`/sun rendering for visual consistency. Do not use
  the square-backed PWA icon inside the app header.
- Reuse established colors, typography, and theme tokens before introducing new
  visual primitives.
- Data-loading, stale, offline, and error states must remain visible and usable.

## 10. Championship Mode

Championship Mode is code-complete but feature-flagged and manually launched.

### Off state

- The live app shows its normal splash and Schedule tab.
- Championship content is dormant.
- Merging Championship code must not enable the mode.

### Preview state

- On local development and Netlify deploy-preview hosts only, append
  `?championshipPreview=1`.
- The preview query must never activate Championship Mode on the production
  hostname.

### On state

Production activation requires the build-time environment variable
`VITE_CHAMPIONSHIP_MODE=true` and a new verified deployment. Do not enable it
without Chad's explicit launch approval.

When enabled:

- Championship splash replaces the normal splash.
- Championship replaces Schedule in navigation.
- The app opens directly to Championship.
- The exact existing AWL sun remains in the header.
- The Championship tab has its distinct AWL sun/trophy treatment.

Championship page section order is intentional:

1. Championship logo and Anderson Heating & Cooling sponsor
2. Weekend schedule
3. Live Championship leaderboard
4. Final groupings
5. Championship rules
6. What's at Stake

Groupings show the group and four golfers, not individual tee times. The shared
message is that everyone should arrive around 6:00 AM and be checked in and ready
to play.

Before launch, verify all of the following:

- Championship worksheet says groupings are confirmed.
- Championship Mode Ready is explicitly approved by Chad.
- Events, sponsor, rules, payouts, and all 16 groupings are correct.
- `/api/sheets/championship` returns HTTP 200 and current sheet content.
- Production flag is still off until the planned launch.
- A production iPhone smoke test passes after activation.
- No push is sent until production verification passes.

## 11. Push notifications

The PWA supports web push through Netlify Functions, Netlify Blobs, and VAPID.
The public app lets users subscribe; sending is protected by an admin secret.

Rules:

- Never auto-prompt for notification permission on page load.
- On iPhone, users install the PWA to the Home Screen before enabling push.
- Never expose VAPID private keys, service credentials, or admin keys.
- A normal standings push uses the title `Leaderboard Update`.
- Championship launch uses worksheet-owned copy and is sent only after the live
  Championship deployment is verified.
- Code merges do not automatically send fleet notifications.

See `docs/push-notifications.md` for implementation details.

## 12. Source control and SDLC

`main` is protected and must remain deployable.

Required process:

1. Start from the latest `main`.
2. Create a short-lived `feature/*`, `fix/*`, or `chore/*` branch.
3. Read this file and `docs/AWL_DOMAIN_RULES.md` for relevant domain behavior.
4. Make the smallest complete change with tests and documentation.
5. Run `npm run check` locally.
6. Push and open a pull request.
7. Wait for GitHub Quality Gate, Devin Review, and Netlify Deploy Preview.
8. Address valid review findings; do not accept suggestions that contradict an
   explicit AWL invariant.
9. Chad reviews the hosted preview when UI behavior changes.
10. Squash-merge only after approval and passing checks.
11. Verify production after Netlify deploys `main`.

Do not push directly to `main`, bypass required checks, force-push protected
history, or merge on behalf of Chad without approval.

### Required validation

`npm run check` runs:

- ESLint
- Node unit and integration tests
- Playwright browser regression tests
- Vite production build

Playwright coverage includes Chromium and iPhone-sized WebKit projects. Update
tests whenever intentional behavior changes. A test passing against static
fixtures is not sufficient validation for a production integration.

### Environments

- Pull requests receive Netlify deploy previews.
- Merging to `main` deploys normal production behavior.
- Feature flags remain disabled until separately approved.
- Important releases receive tags for rollback.
- Netlify's previous successful production deploy is the fastest emergency
  rollback; a Git revert PR is the permanent source rollback.

## 13. Secrets and privacy

Never commit or display:

- Google service-account JSON or private keys
- Push admin keys
- VAPID private keys
- Environment files
- Personal phone numbers or other directory details not required by the feature

Secrets belong in Netlify environment variables or GitHub encrypted secrets.
Documentation may name required environment variables, but never include values.

Relevant variable names include:

- `AWL_GOOGLE_SERVICE_ACCOUNT_JSON`
- `AWL_SHEET_ID`
- `VITE_CHAMPIONSHIP_MODE`
- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `ADMIN_API_KEY`

## 14. Reviewer checklist

Before approving a change, answer:

- Does it preserve automatic regular-week tie splitting?
- Does it keep blanks distinct from numeric zero?
- Does it avoid guessing scores, handicaps, missing players, or special-event
  outcomes?
- Does score re-ingestion preserve birdies without inheriting stale scores?
- Does it keep full leaderboard rows together when sorting?
- Does it preserve alias mapping and OCR row safety?
- Does it keep Championship Mode off unless Chad explicitly approved launch?
- Does it verify live endpoints instead of relying only on fallback data?
- Does it avoid exposing secrets or personal directory data?
- Does it preserve normal mode when Championship Mode is off?
- Does it pass the complete quality gate and relevant hosted smoke tests?

## 15. Common incorrect “fixes” to avoid

- Requiring Chad to approve every normal weekly tie.
- Treating blank score cells as zero.
- Assigning zero-net scores to players who did not play.
- Applying regular-week five-column assumptions to the Major block.
- Overwriting a verified birdie count because a later OCR payload omitted it.
- Backfilling missing incoming scores from stale sheet values.
- Hard-coding Championship groupings that belong in the worksheet.
- Allowing the production preview query to enable Championship Mode.
- Using the rounded-square PWA icon in place of the app's existing sun logo.
- Sending a push notification as a side effect of merging code.
- Declaring production healthy because bundled fallback data rendered.
- Restoring legacy Apps Script/OAuth score writes when direct Sheets API helpers
  already provide the supported path.

## 16. Suggested Devin task prompt

Use this preface with future Devin tasks:

> Read `docs/DEVIN_AWL_KNOWLEDGE.md`, `docs/AWL_DOMAIN_RULES.md`, and the nearest
> `AGENTS.md` before changing code. Treat the documented AWL behaviors as product
> requirements. Do not infer scores or special-event rules. Work on a short-lived
> branch, add proportionate tests, run the full quality gate, and keep
> Championship Mode disabled unless Chad explicitly authorizes launch. In your
> review summary, distinguish genuine defects from intentional league behavior.

## 17. Source-of-truth reminder

This document explains stable product intent and engineering guardrails. Live
scores, standings, dates, groupings, rules text, readiness controls, and event
results can change in Google Sheets. When a task depends on current values,
inspect the live sheet or app endpoint rather than relying on a snapshot in this
document.
