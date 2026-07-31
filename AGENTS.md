# AWL Contributor Context

Before reviewing or changing scoring, score ingestion, or Championship logic,
read `docs/AWL_DOMAIN_RULES.md`.

The documented league behaviors are product requirements, not generic defaults.
In particular, normal weekly ties automatically split points and do not require
confirmation. Do not change that behavior unless Chad Supers explicitly changes
the league rule.

All changes must use a feature or fix branch, pass `npm run check`, and enter
production through a reviewed pull request. Championship Mode must remain off
until Chad explicitly approves launch.
