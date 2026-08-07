# Championship HDCP rollout postmortem

## Summary

On August 6, 2026, the Championship worksheet gained a new `WEEKEND HANDICAPS` section before every installed AWL app instance was running the compatible PR #16 bundle. An already-open iPhone PWA resumed with the old parser and old grouping component. It read the new worksheet structure as extra group cards and did not render the approved Saturday/Sunday HDCP columns.

No scores, handicaps, standings, or worksheet values were lost or overwritten.

## User-visible impact

- The four real group cards used the pre-#16 player-only layout.
- Handicap table rows appeared as two bogus cards, including `Player / Sun HDCP` and `Jake / 14`.
- The screen did not match the approved prototype, even though a clean production load did.

## Root cause

The rollout coupled a live sheet schema change to a frontend parser change without backward-compatible sequencing. The worksheet was changed first. A browser that retained the previous JavaScript bundle therefore received data its parser did not understand.

The installed iPhone app was already open in the background and had no deployment-freshness check when it resumed, so it continued running that old bundle after PR #16 deployed.

## Contributing factors

- Validation covered a clean browser load, not an old client resuming against the new sheet.
- The old grouping parser accepted any nonblank row with player-like cells instead of requiring a `Group #` name.
- Production verification confirmed the new bundle and API independently but did not test the cross-version combination.
- The rollout report said the feature was live without first confirming the installed PWA had refreshed.

## Corrective actions in PR #17

1. Check the current production entry bundle whenever the app becomes visible, receives focus, or returns from the page cache; reload automatically when a newer deployment exists.
2. Require Championship group rows to use the `Group #` structure so unrelated worksheet rows cannot become group cards.
3. Add regression coverage for changed entry bundles and for foreign rows inside the grouping slice.
4. Preserve the approved four-card layout with Player, Sat HDCP, and Sun HDCP columns.

## Future rollout rule

For any sheet schema change, deploy a backward-compatible parser before editing the live worksheet. Verification must include both combinations during the transition:

- new client with old sheet;
- old client with new sheet.

For installed PWAs, also verify resume-from-background behavior rather than relying only on a clean browser session.
