import React, { useEffect } from 'react';
import { colors } from '../themeTokens.js';
import { GolfSplash } from './splash/GolfSplash.jsx';

const ChampionshipSplash = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div data-testid="championship-splash" style={{
      position: 'fixed',
      inset: 0,
      minHeight: '100dvh',
      padding: 'calc(env(safe-area-inset-top, 0px) + 28px) 24px calc(env(safe-area-inset-bottom, 0px) + 28px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fcf6ea',
      color: colors.greenDark,
      animation: 'splashFadeIn 0.5s ease-out',
    }}>
      <div style={{ animation: 'splashPulse 2.8s ease-in-out infinite', textAlign: 'center' }}>
        <img src="/awl-championship-2026.png" alt="Fifth Annual AWL Championship, August 8th and 9th, 2026" style={{ display: 'block', width: 'min(78vw, 330px)', aspectRatio: '1', objectFit: 'contain', mixBlendMode: 'multiply' }} />
        <div style={{ margin: '-8px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ color: colors.greenDark, fontFamily: '"Playfair Display", Georgia, serif', fontSize: 9, fontWeight: 700, letterSpacing: 1.4 }}>PRESENTED BY</span>
          <img src="/anderson-heating-cooling.svg" alt="Anderson Heating and Cooling" style={{ width: 150, maxHeight: 48, objectFit: 'contain' }} />
        </div>
      </div>
      <p style={{ marginTop: 26, color: colors.greenDark, fontFamily: '"Playfair Display", Georgia, serif', fontSize: 18, fontStyle: 'italic', fontWeight: 600, textAlign: 'center' }}>Five years. Two rounds. One champion.</p>
      <div style={{ width: 42, height: 1, marginTop: 22, background: 'rgba(183,135,22,0.72)' }} />
      <div style={{ marginTop: 34, display: 'flex', gap: 9 }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: colors.yellow, animation: `splashBounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />)}
      </div>
    </div>
  );
};

export const SplashScreen = ({ championshipMode = false, sceneIndex = 0, onComplete }) => (
  championshipMode
    ? <ChampionshipSplash onComplete={onComplete} />
    : <GolfSplash sceneIndex={sceneIndex} onComplete={onComplete} />
);
