import React from 'react';
import { colors } from './themeTokens.js';

export const SunLogo = ({ size = 120, color }) => {
  const cx = 60, cy = 60, outerR = 56, innerR = 38, points = 12;
  const coords = [];
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    coords.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <polygon points={coords.join(' ')} fill={color || colors.yellow} />
    </svg>
  );
};
