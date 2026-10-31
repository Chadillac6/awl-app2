export const SPLASH_SHOWN_KEY = 'awl.splashShown';
export const SPLASH_NEXT_SCENE_KEY = 'awl.splashNextScene';

const read = (storage, key) => {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
};
const write = (storage, key, value) => {
  try { storage?.setItem(key, value); } catch { /* storage unavailable (private mode) */ }
};

export function shouldShowSplash(sessionStore) {
  return read(sessionStore, SPLASH_SHOWN_KEY) !== '1';
}

export function markSplashShown(sessionStore) {
  write(sessionStore, SPLASH_SHOWN_KEY, '1');
}

export function takeNextSplashScene(localStore, sceneCount) {
  const stored = Number.parseInt(read(localStore, SPLASH_NEXT_SCENE_KEY), 10);
  const index = Number.isInteger(stored) && stored >= 0 ? stored % sceneCount : 0;
  write(localStore, SPLASH_NEXT_SCENE_KEY, String((index + 1) % sceneCount));
  return index;
}

export function browserStorage(name) {
  try { return globalThis[name] ?? null; } catch { return null; }
}

export function claimSplashScene({ sessionStore, localStore, sceneCount }) {
  if (!shouldShowSplash(sessionStore)) return null;
  markSplashShown(sessionStore);
  return takeNextSplashScene(localStore, sceneCount);
}
