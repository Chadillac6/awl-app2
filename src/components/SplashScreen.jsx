import React, { useEffect } from 'react';
import { colors, SunLogo } from '../theme.jsx';

export const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes splashFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes splashPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes splashBounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.55; } 40% { transform: translateY(-8px); opacity: 1; } }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: colors.green,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'splashFadeIn 0.5s ease-out',
        minHeight: '100dvh',
        height: '-webkit-fill-available',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        overflow: 'hidden',
      }}>
      <div style={{ animation: 'splashPulse 2s ease-in-out infinite' }}>
        <SunLogo size={120} />
      </div>
      <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 32, fontWeight: 700, color: colors.offWhite, marginTop: 24, letterSpacing: 2, textAlign: 'center', textTransform: 'uppercase' }}>AM Walking</h1>
      <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 32, fontWeight: 700, color: colors.offWhite, marginTop: -4, letterSpacing: 2, textAlign: 'center', textTransform: 'uppercase' }}>League</h1>
      <p style={{ fontFamily: '"Source Sans 3", system-ui, sans-serif', fontSize: 13, color: colors.offWhiteMuted, letterSpacing: 4, textTransform: 'uppercase', marginTop: 12 }}>Est. 2022</p>
      <div style={{ marginTop: 48, display: 'flex', gap: 8 }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: colors.yellow, animation: `splashBounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />)}
      </div>
    </div>
    </>
  );
};
