import React, { useEffect, useId, useRef, useState } from 'react';
import { colors } from '../../themeTokens.js';
import { GOLF_SPLASH_SCENES, SCENE_END } from './golfScenes.js';

const PLAY_MS = 2650;
const FADE_MS = 350;
const REDUCED_HOLD_MS = 700;
const REDUCED_FADE_MS = 300;

const prefersReducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const GolfSplash = ({ sceneIndex = 0, onComplete }) => {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const completeRef = useRef(onComplete);
  const [reducedMotion] = useState(prefersReducedMotion);
  const idPrefix = `awl-splash-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scene = GOLF_SPLASH_SCENES[sceneIndex % GOLF_SPLASH_SCENES.length];

  useEffect(() => { completeRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const svg = svgRef.current;
    const root = rootRef.current;
    const render = scene.build(svg, idPrefix);
    const holdMs = reducedMotion ? REDUCED_HOLD_MS : PLAY_MS;
    const fadeMs = reducedMotion ? REDUCED_FADE_MS : FADE_MS;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const elapsed = now - start;
      render(reducedMotion ? SCENE_END : Math.min(SCENE_END, (elapsed / PLAY_MS) * SCENE_END));
      root.style.opacity = String(1 - Math.min(1, Math.max(0, (elapsed - holdMs) / fadeMs)));
      if (elapsed < holdMs + fadeMs) frame = requestAnimationFrame(tick);
    };
    render(reducedMotion ? SCENE_END : 0);
    frame = requestAnimationFrame(tick);
    const timer = setTimeout(() => completeRef.current?.(), holdMs + fadeMs);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      svg.replaceChildren();
    };
  }, [scene, reducedMotion, idPrefix]);

  useEffect(() => {
    const onKey = (event) => {
      if (['Escape', 'Enter', ' '].includes(event.key)) completeRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={rootRef}
      data-testid="golf-splash"
      data-scene={scene.id}
      data-motion={reducedMotion ? 'reduced' : 'full'}
      onClick={() => completeRef.current?.()}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: colors.green, overflow: 'hidden', cursor: 'pointer' }}
    >
      <svg ref={svgRef} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid meet" role="img" aria-label="AM Walking League" style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }} />
    </div>
  );
};
