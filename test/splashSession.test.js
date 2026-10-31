import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SPLASH_NEXT_SCENE_KEY,
  SPLASH_SHOWN_KEY,
  claimSplashScene,
  shouldShowSplash,
  takeNextSplashScene,
} from '../src/lib/splashSession.js';

const memoryStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    data,
  };
};

const brokenStorage = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
};

test('splash shows on the first open of a session and is skipped after that', () => {
  const session = memoryStorage();
  const local = memoryStorage();
  assert.equal(claimSplashScene({ sessionStore: session, localStore: local, sceneCount: 3 }), 0);
  assert.equal(session.data.get(SPLASH_SHOWN_KEY), '1');
  assert.equal(shouldShowSplash(session), false);
  assert.equal(claimSplashScene({ sessionStore: session, localStore: local, sceneCount: 3 }), null);
});

test('each new session takes the next scene in order and wraps around', () => {
  const local = memoryStorage();
  const scenes = [0, 1, 2, 3].map(() => claimSplashScene({ sessionStore: memoryStorage(), localStore: local, sceneCount: 3 }));
  assert.deepEqual(scenes, [0, 1, 2, 0]);
  assert.equal(local.data.get(SPLASH_NEXT_SCENE_KEY), '1');
});

test('a corrupt or out-of-range stored scene falls back safely', () => {
  assert.equal(takeNextSplashScene(memoryStorage({ [SPLASH_NEXT_SCENE_KEY]: 'banana' }), 3), 0);
  assert.equal(takeNextSplashScene(memoryStorage({ [SPLASH_NEXT_SCENE_KEY]: '-4' }), 3), 0);
  assert.equal(takeNextSplashScene(memoryStorage({ [SPLASH_NEXT_SCENE_KEY]: '7' }), 3), 1);
});

test('unavailable storage still shows the first scene instead of crashing', () => {
  assert.equal(claimSplashScene({ sessionStore: brokenStorage, localStore: brokenStorage, sceneCount: 3 }), 0);
  assert.equal(claimSplashScene({ sessionStore: null, localStore: null, sceneCount: 3 }), 0);
});
