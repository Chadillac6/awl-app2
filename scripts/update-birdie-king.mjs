#!/usr/bin/env node
import { updateLeaderboardBirdieKing } from '../src/lib/birdieKing.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';

const summary = await updateLeaderboardBirdieKing({ spreadsheetId: SHEET_ID });
console.log(JSON.stringify(summary, null, 2));
