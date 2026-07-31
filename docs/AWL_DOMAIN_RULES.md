# AWL Domain Rules for Contributors and Automated Reviewers

These rules are intentional product behavior. Do not “correct” them to a more
generic golf workflow without Chad Supers explicitly changing the league rule.

## Regular-week ties

- Regular-week points are 4, 2, 1, and 0 within each four-player group.
- Ties automatically split the occupied point slots equally.
- Example: a two-way tie for first awards 3 points to each player: (4 + 2) / 2.
- Normal weekly ties do not require Chad to confirm the split.
- Tie confirmation is opt-in and reserved for exceptional or manually managed
  events.

## Birdies during score re-ingestion

- A completed round with a verified zero birdies must store an explicit 0.
- If a later scorecard payload omits birdie data, preserve any birdie count
  already stored in the sheet.
- Replace an existing count only when the incoming payload explicitly provides
  a birdie value, including zero.

## Championship and special events

- Championship and special-event scoring is manual and must not be inferred
  from regular-week rules.
- Championship Mode remains disabled until Chad explicitly approves launch.
- The live Championship worksheet endpoint must pass its production readiness
  check before the mode can be enabled.
