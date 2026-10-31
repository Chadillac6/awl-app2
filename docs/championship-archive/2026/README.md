# 2026 Championship Worksheet Archive

`championship-sheet-2026.csv` is a verbatim snapshot of the live Championship
worksheet, saved before the sheet is reset for 2027.

- Captured: 2026-10-31 (19:54 UTC)
- Source: `https://amwalkingleague.netlify.app/api/sheets/championship`
- Sheet range: `Championship!A1:H1000` (see `netlify/functions/sheet-csv.js`)
- The Google Sheet was only read, never modified.

## Caveat

The `CHAMPIONSHIP LEADERBOARD` section in this snapshot is incomplete (most
golfers only have a Round 1 net entered). Treat it as a record of how the sheet
looked, not as the final standings. The official 2026 results live in the
History tab data: `historicalData` in `src/data/staticData.js`.

The file can be parsed with `parseChampionshipCSV` from `src/data/sheets.js`,
which makes it a handy fixture when testing the 2027 relaunch.
