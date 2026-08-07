#!/usr/bin/env node
import { getSpreadsheetValues, updateSpreadsheetValues } from '../src/lib/googleSheetsBatch.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const apply = process.argv.includes('--apply');

const sheet = await getSpreadsheetValues({ spreadsheetId: SHEET_ID, range: 'Championship!A1:H1000' });
const rows = sheet.values ?? [];
const sectionIndex = rows.findIndex((row) => String(row[0] ?? '').trim().toUpperCase() === 'CHAMPIONSHIP LEADERBOARD');
if (sectionIndex < 0) throw new Error('Championship leaderboard section was not found');
const finalResultsIndex = rows.findIndex((row, index) => index > sectionIndex && String(row[0] ?? '').trim().toUpperCase() === 'FINAL RESULTS');
if (finalResultsIndex < 0) throw new Error('Final Results section was not found after the Championship leaderboard');

const startRow = sectionIndex + 3;
const playerRows = rows.slice(sectionIndex + 2, finalResultsIndex).filter((row) => String(row[1] ?? '').trim());
if (playerRows.length !== 16) throw new Error(`Expected 16 Championship golfers, found ${playerRows.length}`);
const endRow = startRow + playerRows.length - 1;

const formulas = playerRows.map((_, index) => {
  const row = startRow + index;
  return [
    `=IF(OR(REGEXMATCH(UPPER(TRIM(TO_TEXT(D${row}))),"^DN(P|F)$"),REGEXMATCH(UPPER(TRIM(TO_TEXT(E${row}))),"^DN(P|F)$")),"DNF",IF(OR(D${row}="",E${row}=""),"",D${row}+E${row}))`,
  ];
});

if (!apply) {
  console.log(JSON.stringify({ mode: 'preview', range: `Championship!F${startRow}:F${endRow}`, players: playerRows.map((row) => row[1]), formulas }, null, 2));
  process.exit(0);
}

await updateSpreadsheetValues({
  spreadsheetId: SHEET_ID,
  range: `Championship!F${startRow}:F${endRow}`,
  values: formulas,
});

const verification = await getSpreadsheetValues({
  spreadsheetId: SHEET_ID,
  range: `Championship!B${startRow}:F${endRow}`,
});

console.log(JSON.stringify({ mode: 'applied', rows: verification.values ?? [] }, null, 2));
