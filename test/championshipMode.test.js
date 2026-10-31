import assert from 'node:assert/strict';
import test from 'node:test';
import { isChampionshipModeEnabled, isChampionshipPreviewRequest } from '../src/lib/championshipMode.js';

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

const production = { isDevelopment: false, hostname: 'amwalkingleague.netlify.app', search: '' };

test('production is regular unless the exact true build flag is set', () => {
  for (const configuredMode of [undefined, '', 'false', 'TRUE', '1', true]) {
    assert.equal(isChampionshipModeEnabled({ ...production, configuredMode }), false);
    assert.equal(isChampionshipModeEnabled({ ...production, configuredMode, search: '?championshipPreview=1' }), false);
  }
  assert.equal(isChampionshipModeEnabled({ ...production, configuredMode: 'true' }), true);
  assert.equal(isChampionshipModeEnabled({ ...production, configuredMode: 'true', search: '?championshipPreview=0' }), true);
});

test('only explicit preview opt-in on local development or the exact AWL deploy preview host works', () => {
  for (const hostname of ['localhost', 'amwalkingleague.netlify.app', 'branch--amwalkingleague.netlify.app', 'deploy-preview-2--other.netlify.app', 'deploy-preview-2--amwalkingleague.netlify.app.evil.example']) {
    assert.equal(isChampionshipModeEnabled({ configuredMode: 'false', isDevelopment: false, hostname, search: '?championshipPreview=1' }), false);
  }
  for (const isDevelopment of [false, true]) {
    for (const search of ['', '?championshipPreview=0', '?championshipPreview=true']) {
      assert.equal(isChampionshipModeEnabled({ configuredMode: 'false', isDevelopment, hostname: 'deploy-preview-2--amwalkingleague.netlify.app', search }), false);
    }
    assert.equal(isChampionshipModeEnabled({ configuredMode: 'false', isDevelopment, hostname: 'deploy-preview-2--amwalkingleague.netlify.app', search: '?championshipPreview=1' }), true);
  }
  assert.equal(isChampionshipModeEnabled({ configuredMode: 'false', isDevelopment: true, hostname: 'localhost', search: '?championshipPreview=1' }), true);
});
