import { colors as C } from '../../themeTokens.js';

const NS = 'http://www.w3.org/2000/svg';
export const SCENE_END = 3.0;
const APP_GREEN = C.green;
// Scenes are drawn on a 390x844 phone canvas; backgrounds bleed past it so wider or taller screens never show bars.
const BLEED = { x: -1000, y: -1000, width: 2390, height: 2844 };
const vertical = (id) => ({ id, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: 844 });

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = {
  outCubic: (p) => 1 - (1 - p) ** 3,
  inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  outQuad: (p) => 1 - (1 - p) * (1 - p),
  inQuad: (p) => p * p,
  outBack: (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2; },
};
const quad = (p, a, c, b) => (1 - p) * (1 - p) * a + 2 * (1 - p) * p * c + p * p * b;
const cubic = (p, a, c1, c2, b) => (1 - p) ** 3 * a + 3 * (1 - p) ** 2 * p * c1 + 3 * (1 - p) * p * p * c2 + p ** 3 * b;

function el(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  if (parent) parent.appendChild(node);
  return node;
}
const set = (node, attrs) => { for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); };

function sunPoints(outer = 56, inner = 38, points = 12) {
  const coords = [];
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    coords.push(`${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`);
  }
  return coords.join(' ');
}

function defs(svg, id) {
  const d = el('defs', {}, svg);
  const glow = el('radialGradient', { id: `${id}-glow` }, d);
  el('stop', { offset: '0%', 'stop-color': '#ffe9a3', 'stop-opacity': '0.9' }, glow);
  el('stop', { offset: '45%', 'stop-color': C.yellow, 'stop-opacity': '0.35' }, glow);
  el('stop', { offset: '100%', 'stop-color': C.yellow, 'stop-opacity': '0' }, glow);
  return d;
}

// Blends the scene into the fixed green safe-area strip painted by index.css.
function topBlend(svg, id, height) {
  const grad = el('linearGradient', { id: `${id}-top`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: height }, svg.querySelector('defs'));
  el('stop', { offset: '0%', 'stop-color': APP_GREEN, 'stop-opacity': '1' }, grad);
  el('stop', { offset: '100%', 'stop-color': APP_GREEN, 'stop-opacity': '0' }, grad);
  el('rect', { x: BLEED.x, y: BLEED.y, width: BLEED.width, height: -BLEED.y, fill: APP_GREEN }, svg);
  el('rect', { x: BLEED.x, y: 0, width: BLEED.width, height, fill: `url(#${id}-top)` }, svg);
}

function wordmark(svg, y) {
  const g = el('g', {}, svg);
  const serif = '"Playfair Display", Georgia, serif';
  const line = (text, dy) => el('text', { x: 195, y: y + dy, 'text-anchor': 'middle', fill: C.offWhite, 'font-family': serif, 'font-size': 36, 'font-weight': 700, 'letter-spacing': 3, text }, g);
  const l1 = line('AM WALKING', 0);
  const l2 = line('LEAGUE', 42);
  const rule = el('rect', { x: 175, y: y + 62, width: 40, height: 1.5, fill: C.yellow }, g);
  const est = el('text', { x: 195, y: y + 88, 'text-anchor': 'middle', fill: C.offWhiteMuted, 'font-family': '"Source Sans 3", system-ui, sans-serif', 'font-size': 13, 'font-weight': 600, 'letter-spacing': 5, text: 'EST. 2022' }, g);
  return (p, p2) => {
    const a = ease.outCubic(p);
    const b = ease.outCubic(seg(p, 0.15, 1));
    set(l1, { opacity: a, transform: `translate(0 ${lerp(16, 0, a)})`, 'letter-spacing': lerp(10, 3, a) });
    set(l2, { opacity: b, transform: `translate(0 ${lerp(16, 0, b)})`, 'letter-spacing': lerp(10, 3, b) });
    set(rule, { opacity: p2, transform: `translate(195 0) scale(${ease.outCubic(p2)} 1) translate(-195 0)` });
    set(est, { opacity: ease.outCubic(seg(p2, 0.3, 1)) });
  };
}

function sun(parent, fill = C.yellow) {
  const g = el('g', {}, parent);
  el('polygon', { points: sunPoints(), fill }, g);
  return (x, y, s, r, o) => set(g, { transform: `translate(${x} ${y}) rotate(${r}) scale(${s})`, opacity: o });
}

function holeInOne(svg, id) {
  const d = defs(svg, id);
  const sky = el('linearGradient', vertical(`${id}-sky`), d);
  el('stop', { offset: '0%', 'stop-color': C.green }, sky);
  el('stop', { offset: '100%', 'stop-color': C.greenLight }, sky);
  el('rect', { ...BLEED, fill: `url(#${id}-sky)` }, svg);
  const glow = el('circle', { cx: 0, cy: 0, r: 150, fill: `url(#${id}-glow)`, opacity: 0 }, svg);
  const rays = el('g', { opacity: 0 }, svg);
  const rayLines = Array.from({ length: 12 }, (_, i) => el('line', { x1: 0, y1: 0, x2: 0, y2: -1, stroke: C.yellowLight, 'stroke-width': 3, 'stroke-linecap': 'round', transform: `rotate(${i * 30 + 15})` }, rays));
  el('path', { d: 'M-1000 660 L0 620 Q195 575 390 620 L1390 660 L1390 1844 L-1000 1844 Z', fill: '#0b6532' }, svg);
  el('ellipse', { cx: 290, cy: 612, rx: 86, ry: 11, fill: '#18a456' }, svg);
  el('rect', { x: 66.5, y: 603, width: 3, height: 12, fill: C.offWhite, rx: 1 }, svg);
  const clip = el('clipPath', { id: `${id}-trail` }, d);
  const clipRect = el('rect', { x: 0, y: 0, width: 0, height: 844 }, clip);
  const trail = el('path', { d: 'M70 597 Q180 120 290 600', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', opacity: 0.5, 'clip-path': `url(#${id}-trail)` }, svg);
  const swoosh = el('path', { d: 'M28 570 Q50 612 96 600', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }, svg);
  const impact = el('g', { opacity: 0 }, svg);
  [[-14, -10], [0, -16], [14, -10]].forEach(([dx, dy]) => el('line', { x1: 70 + dx * 0.5, y1: 597 + dy * 0.5, x2: 70 + dx, y2: 597 + dy, stroke: C.yellowLight, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, impact));
  const shadow = el('ellipse', { cx: 70, cy: 612, rx: 6, ry: 2, fill: '#000', opacity: 0.25 }, svg);
  el('ellipse', { cx: 290, cy: 610, rx: 11, ry: 3.8, fill: '#05301a' }, svg);
  const ring = el('ellipse', { cx: 290, cy: 610, rx: 11, ry: 3.8, fill: 'none', stroke: C.yellowLight, 'stroke-width': 2, opacity: 0 }, svg);
  const flag = el('g', {}, svg);
  el('line', { x1: 292, y1: 610, x2: 292, y2: 468, stroke: C.offWhite, 'stroke-width': 2.5 }, flag);
  const pennant = el('path', { d: 'M292 468 L334 481 L292 494 Z', fill: C.yellow }, flag);
  const ball = el('circle', { cx: 70, cy: 597, r: 7, fill: '#fff' }, svg);
  const placeSun = sun(svg);
  const words = wordmark(svg, 470);
  topBlend(svg, id, 90);

  return (t) => {
    set(swoosh, { opacity: t < 0.22 ? 0 : (1 - seg(t, 0.3, 0.5)) * 0.8 });
    set(impact, { opacity: t < 0.32 ? 0 : 1 - seg(t, 0.34, 0.6) });
    const f = ease.inOutSine(seg(t, 0.32, 1.32));
    let bx = quad(f, 70, 180, 290);
    let by = quad(f, 597, 120, 600);
    let br = 7;
    set(clipRect, { width: t < 0.32 ? 0 : bx });
    set(trail, { opacity: 0.5 * (1 - seg(t, 1.45, 1.9)) });
    if (t > 1.32) {
      const drop = seg(t, 1.32, 1.45);
      bx = 290; by = lerp(600, 611, drop); br = lerp(6, 0, drop);
    }
    set(ball, { cx: bx, cy: by, r: br });
    const h = clamp((612 - by) / 300);
    set(shadow, { cx: bx, rx: lerp(6, 2, h), opacity: t > 1.42 ? 0 : lerp(0.28, 0.08, h) });
    const rp = seg(t, 1.42, 1.9);
    set(ring, { rx: lerp(11, 60, rp), ry: lerp(3.8, 12, rp), opacity: t < 1.42 ? 0 : 1 - rp });
    const wiggle = Math.sin(seg(t, 1.42, 2.0) * Math.PI * 5) * (1 - seg(t, 1.42, 2.0)) * 0.35;
    set(pennant, { transform: `translate(292 481) scale(${1 - Math.abs(wiggle) * 0.6} ${1 + wiggle * 0.3}) translate(-292 -481)` });
    set(flag, { opacity: 1 - seg(t, 1.9, 2.25) });
    const e = seg(t, 1.45, 2.25);
    const sx = lerp(290, 195, ease.outCubic(e));
    const sy = lerp(610, 300, ease.outCubic(e));
    const visible = t >= 1.45;
    placeSun(sx, sy, visible ? lerp(0.05, 1.35, ease.outBack(e)) : 0, lerp(-140, 0, ease.outCubic(e)) + Math.max(0, t - 2.25) * 12, visible ? 1 : 0);
    set(glow, { cx: sx, cy: sy, r: lerp(20, 170, ease.outCubic(e)), opacity: visible ? 0.85 * ease.outCubic(e) : 0 });
    const rb = seg(t, 1.95, 2.6);
    set(rays, { transform: 'translate(195 300)', opacity: t < 1.95 ? 0 : 1 - ease.inQuad(rb) });
    rayLines.forEach((line) => set(line, { y1: -lerp(80, 120, rb), y2: -lerp(90, 175, ease.outCubic(rb)) }));
    words(seg(t, 2.05, 2.6), seg(t, 2.2, 2.75));
  };
}

function thePutt(svg, id) {
  const d = defs(svg, id);
  const green = el('radialGradient', { id: `${id}-green`, gradientUnits: 'userSpaceOnUse', cx: 195, cy: 354, r: 640 }, d);
  el('stop', { offset: '0%', 'stop-color': '#1fb35f' }, green);
  el('stop', { offset: '100%', 'stop-color': '#0d6e38' }, green);
  el('rect', { ...BLEED, fill: `url(#${id}-green)` }, svg);
  const stripes = el('g', { transform: 'rotate(-18 195 422)' }, svg);
  for (let i = -30; i < 40; i += 1) el('rect', { x: i * 56, y: -1500, width: 28, height: 4000, fill: '#fff', opacity: 0.045 }, stripes);
  topBlend(svg, id, 110);
  const brand = el('rect', { ...BLEED, fill: C.green, opacity: 0 }, svg);
  const glow = el('circle', { cx: 195, cy: 320, r: 160, fill: `url(#${id}-glow)`, opacity: 0 }, svg);
  const rings = [0, 1, 2].map(() => el('circle', { cx: 195, cy: 320, r: 14, fill: 'none', stroke: C.yellowLight, 'stroke-width': 2, opacity: 0 }, svg));
  const P = [[115, 800], [40, 600], [330, 520], [195, 320]];
  const puttLine = el('path', { d: `M${P[0]} C${P[1]} ${P[2]} ${P[3]}`, fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.22 }, svg);
  const len = puttLine.getTotalLength();
  set(puttLine, { 'stroke-dasharray': len, 'stroke-dashoffset': len });
  const cup = el('g', {}, svg);
  el('circle', { cx: 195, cy: 320, r: 16, fill: '#e9efe7', opacity: 0.25 }, cup);
  el('circle', { cx: 195, cy: 320, r: 13.5, fill: '#052a15' }, cup);
  el('circle', { cx: 195, cy: 323, r: 10, fill: '#021a0c' }, cup);
  const shadow = el('circle', { cx: 0, cy: 0, r: 9, fill: '#000', opacity: 0.22 }, svg);
  const ball = el('g', {}, svg);
  const ballFace = el('circle', { cx: 0, cy: 0, r: 9, fill: '#fff' }, ball);
  const dimples = el('g', { opacity: 0.18 }, ball);
  [[3, 2], [-2, 4], [4, -3], [0, -1]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 1, fill: '#577' }, dimples));
  const placeSun = sun(svg);
  const placeDarkSun = sun(svg, '#052a15');
  const words = wordmark(svg, 480);

  return (t) => {
    const r = ease.outQuad(seg(t, 0.1, 1.45));
    const bx = cubic(r, P[0][0], P[1][0], P[2][0], P[3][0]);
    const by = cubic(r, P[0][1], P[1][1], P[2][1], P[3][1]);
    set(puttLine, { 'stroke-dashoffset': len * (1 - r), opacity: 0.22 * (1 - seg(t, 1.7, 2.1)) });
    const drop = seg(t, 1.45, 1.6);
    set(ball, { transform: `translate(${bx} ${by + drop * 2}) rotate(${r * 900}) scale(${lerp(1, 0.45, drop)})`, opacity: 1 - drop });
    set(ballFace, { fill: drop > 0 ? '#e6efe8' : '#fff' });
    set(shadow, { cx: bx + 2.5, cy: by + 3, opacity: 0.22 * (1 - drop) });
    const m = seg(t, 1.58, 2.3);
    const visible = t >= 1.58;
    const scale = visible ? lerp(0.26, 1.55, ease.outBack(m)) : 0;
    const rot = lerp(0, 165, ease.outCubic(m)) + Math.max(0, t - 2.3) * 12;
    placeSun(195, 320, scale, rot, visible ? 1 : 0);
    placeDarkSun(195, 320, scale, rot, visible ? 1 - ease.outCubic(seg(t, 1.6, 1.95)) : 0);
    set(cup, { opacity: 1 - seg(t, 1.58, 1.7) });
    set(glow, { opacity: 0.9 * ease.outCubic(seg(t, 1.7, 2.3)), r: lerp(40, 180, ease.outCubic(m)) });
    rings.forEach((ring, i) => {
      const p = seg(t, 1.58 + i * 0.12, 2.3 + i * 0.12);
      set(ring, { r: lerp(14, 340, ease.outCubic(p)), opacity: p <= 0 ? 0 : (1 - p) * 0.7 });
    });
    set(brand, { opacity: ease.inOutSine(seg(t, 1.75, 2.5)) });
    words(seg(t, 2.1, 2.65), seg(t, 2.25, 2.8));
  };
}

function sunrise(svg, id) {
  const d = defs(svg, id);
  const night = el('linearGradient', vertical(`${id}-night`), d);
  el('stop', { offset: '0%', 'stop-color': '#04140d' }, night);
  el('stop', { offset: '70%', 'stop-color': '#0f3a26' }, night);
  el('stop', { offset: '100%', 'stop-color': '#21543a' }, night);
  const dawn = el('linearGradient', vertical(`${id}-dawn`), d);
  el('stop', { offset: '0%', 'stop-color': C.green }, dawn);
  el('stop', { offset: '45%', 'stop-color': C.green }, dawn);
  el('stop', { offset: '68%', 'stop-color': '#c9b055' }, dawn);
  el('stop', { offset: '78%', 'stop-color': '#f3cf6e' }, dawn);
  el('rect', { ...BLEED, fill: `url(#${id}-night)` }, svg);
  topBlend(svg, id, 120);
  const dawnSky = el('rect', { ...BLEED, fill: `url(#${id}-dawn)`, opacity: 0 }, svg);
  const stars = el('g', {}, svg);
  [[40, 160], [90, 230], [150, 130], [240, 170], [320, 140], [355, 260], [60, 330], [280, 300], [200, 230], [120, 400], [330, 420]]
    .forEach(([x, y], i) => el('circle', { cx: x, cy: y, r: i % 3 ? 1.1 : 1.6, fill: '#fff', opacity: 0.7 }, stars));
  const glow = el('circle', { cx: 195, cy: 700, r: 230, fill: `url(#${id}-glow)`, opacity: 0 }, svg);
  const godRays = el('g', { opacity: 0 }, svg);
  for (let i = 0; i < 12; i += 1) el('path', { d: 'M0 0 L-26 -560 L26 -560 Z', fill: '#fff3c4', opacity: 0.5, transform: `rotate(${i * 30})` }, godRays);
  const placeSun = sun(svg);
  el('path', { d: 'M-1000 640 L0 600 C 110 548, 280 540, 390 585 L1390 630 L1390 1844 L-1000 1844 Z', fill: '#062a16' }, svg);
  el('path', { d: 'M0 600 C 110 548, 280 540, 390 585', fill: 'none', stroke: '#1c7a45', 'stroke-width': 2, opacity: 0.8 }, svg);
  el('path', { d: 'M-1000 700 L0 690 C 140 650, 260 660, 390 640 L1390 650 L1390 1844 L-1000 1844 Z', fill: '#041d0f' }, svg);
  el('line', { x1: 262, y1: 557, x2: 262, y2: 448, stroke: '#031409', 'stroke-width': 3 }, svg);
  const pennant = el('path', { d: 'M262 448 L300 460 L262 472 Z', fill: '#031409' }, svg);
  el('ellipse', { cx: 260, cy: 557, rx: 7, ry: 2.4, fill: '#010a05' }, svg);
  const ball = el('circle', { cx: -10, cy: 500, r: 5, fill: '#fff' }, svg);
  const words = wordmark(svg, 712);

  return (t) => {
    let bx;
    let by;
    let br = 5;
    if (t < 0.95) {
      const p = ease.inOutSine(seg(t, 0.05, 0.95));
      bx = quad(p, -10, 90, 196); by = quad(p, 500, 220, 552);
    } else if (t < 1.15) {
      const p = seg(t, 0.95, 1.15);
      bx = lerp(196, 226, p); by = 551 - Math.sin(p * Math.PI) * 16;
    } else {
      const p = ease.outQuad(seg(t, 1.15, 1.42));
      bx = lerp(226, 260, p); by = lerp(551, 553, p);
      if (t > 1.42) { const q = seg(t, 1.42, 1.52); by = 553 + q * 4; br = 5 * (1 - q); }
    }
    set(ball, { cx: bx, cy: by, r: Math.max(0, br) });
    const wiggle = Math.sin(seg(t, 1.45, 2.0) * Math.PI * 5) * (1 - seg(t, 1.45, 2.0)) * 0.35;
    set(pennant, { transform: `translate(262 460) scale(${1 - Math.abs(wiggle) * 0.6} ${1 + wiggle * 0.3}) translate(-262 -460)` });
    const rise = ease.outCubic(seg(t, 1.45, 2.55));
    const sy = lerp(690, 345, rise);
    const visible = t >= 1.45;
    placeSun(195, sy, 1.7, lerp(-60, 0, rise) + Math.max(0, t - 2.55) * 10, visible ? 1 : 0);
    set(glow, { cy: sy, opacity: visible ? lerp(0.4, 1, rise) : 0 });
    set(godRays, { transform: `translate(195 ${sy}) rotate(${t * 8})`, opacity: 0.22 * ease.outCubic(seg(t, 1.8, 2.5)) });
    set(dawnSky, { opacity: ease.inOutSine(seg(t, 1.45, 2.6)) });
    set(stars, { opacity: 1 - seg(t, 1.4, 2.1) });
    words(seg(t, 2.15, 2.7), seg(t, 2.3, 2.85));
  };
}

export const GOLF_SPLASH_SCENES = [
  { id: 'hole-in-one', build: holeInOne },
  { id: 'putt', build: thePutt },
  { id: 'sunrise', build: sunrise },
];
