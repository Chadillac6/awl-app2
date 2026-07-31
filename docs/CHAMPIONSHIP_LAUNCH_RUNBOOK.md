# Championship Mode Launch Runbook

## Release behavior

PR #13 is the production launch switch. Its Netlify deploy preview stays in
normal mode by default and exposes Championship Mode only through the approved
`?championshipPreview=1` preview URL. Merging the PR into `main` starts a
production Netlify deployment with `VITE_CHAMPIONSHIP_MODE=true`.

The merge does not update the installed app instantaneously. The launch is
complete only after Netlify reports the production deploy as ready and the
production checks below pass.

## Before merge

1. Confirm the Championship worksheet contains four groups and 16 unique players.
2. Confirm `Groupings Confirmed?` is `YES`.
3. Review schedule, leaderboard, groupings, rules, and payouts in that order.
4. Review the deploy preview on an installed iPhone PWA and in Safari.
5. Run `npm run check` and `npm run verify:championship -- <preview URL>`.
6. Confirm GitHub Quality Gate, Devin Review, and Netlify Deploy Preview pass.
7. Immediately before launch, Chad changes `Championship Mode Ready?` to `YES`.
8. Run the verifier again with `--require-ready`.

## Timed launch

1. Merge PR #13 five to ten minutes before the desired announcement window.
2. Wait for the Netlify production deployment to report `ready`.
3. Open the production app in a fresh browser and the installed iPhone PWA.
4. Confirm the Championship splash appears and Schedule is replaced by Championship.
5. Confirm the production Championship endpoint returns current worksheet data.
6. Navigate through Leaderboard, Championship, Rules, History, and Stats.
7. Only after every production check passes, announce the launch and send the
   approved `Championship Mode Engaged` fleet notification.

## Regression and back-testing

- Node tests cover scoring, ingestion, tie splitting, birdie preservation,
  Championship parsing, and the production-only activation setting.
- Playwright runs normal and Championship paths in mobile Chromium and three
  iPhone-sized WebKit projects.
- Normal mode retains Schedule and has no Championship page.
- Championship mode replaces only Schedule; Leaderboard, Rules, History, and
  Stats must still render without errors.
- The launch PR must not change score ingestion, point calculations, historic
  results, or Google Sheet write behavior.

## Rollback

If production verification fails, do not send the notification. Restore the
previous successful Netlify production deploy immediately, then open a revert
PR for #13. The prior build has Championship Mode disabled and restores the
Schedule tab without changing league data.
