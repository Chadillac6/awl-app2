import assert from 'node:assert/strict';
import test from 'node:test';
import { isChampionshipPreviewRequest } from '../src/lib/championshipMode.js';

test('championship preview query works in local development', () => {
  assert.equal(isChampionshipPreviewRequest({
    isDevelopment: true,
    hostname: 'localhost',
    search: '?championshipPreview=1',
  }), true);
});

test('championship preview query works on AWL Netlify deploy previews', () => {
  assert.equal(isChampionshipPreviewRequest({
    isDevelopment: false,
    hostname: 'deploy-preview-2--amwalkingleague.netlify.app',
    search: '?championshipPreview=1',
  }), true);
});

test('championship preview query stays disabled on production', () => {
  assert.equal(isChampionshipPreviewRequest({
    isDevelopment: false,
    hostname: 'amwalkingleague.netlify.app',
    search: '?championshipPreview=1',
  }), false);
});
