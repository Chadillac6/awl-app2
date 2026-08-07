#!/usr/bin/env node
import { getSpreadsheetValues, updateSpreadsheetValues } from '../src/lib/googleSheetsBatch.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const START_ROW = 46;
const END_ROW = 61;
const apply = process.argv.includes('--apply');

const formulas = Array.from({ length: END_ROW - START_ROW + 1 }, (_, index) => {
  const row = START_ROW + index;
  return [
    `=IF(OR(UPPER(TRIM(TO_TEXT(D${row})))="DNP",UPPER(TRIM(TO_TEXT(E${row})))="DNP"),"DNF",IF(OR(D${row}="",E${row}=""),"",D${row}+E${row}))`,
  ];
});

if (!apply) {
  console.log(JSON.stringify({ mode: 'preview', range: `Championship!F${START_ROW}:F${END_ROW}`, formulas }, null, 2));
  process.exit(0);
}

await updateSpreadsheetValues({
  spreadsheetId: SHEET_ID,
  range: `Championship!F${START_ROW}:F${END_ROW}`,
  values: formulas,
});

const verification = await getSpreadsheetValues({
  spreadsheetId: SHEET_ID,
  range: `Championship!B${START_ROW}:F${END_ROW}`,
});

console.log(JSON.stringify({ mode: 'applied', rows: verification.values ?? [] }, null, 2));
