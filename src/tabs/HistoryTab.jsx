import React, { useEffect, useState } from 'react';
import { historicalData } from '../data/staticData';
import { colors } from '../theme.jsx';

const champPhotos = { 2022: '/championship2022.jpg', 2023: '/championship2023.jpg', 2024: '/championship2024.jpg', 2025: '/championship2025.jpeg' };
const champPhotoPositions = { 2022: 'center 29%', 2023: 'center 34%', 2024: 'center 29%', 2025: 'center 31%' };
const senecaPhotos = { 2025: '/seneca2025.jpeg' };
const senecaPhotoPositions = { 2025: 'center 26%' };

export const HistoryTab = () => {
  const [expandedYear, setExpandedYear] = useState(null);
  const [expandedSeneca, setExpandedSeneca] = useState(null);
  const [showCurrentChampResults, setShowCurrentChampResults] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const currentChamp = historicalData.championships[0];
  const pastChamps = historicalData.championships.slice(1);

  return (
    <div style={{ padding: '0 16px 100px' }}>
      <FeatureCard item={currentChamp} isMobile={isMobile} showResults={showCurrentChampResults} onToggle={() => setShowCurrentChampResults((v) => !v)} />
      <h3 style={{ fontFamily: '"Playfair Display", Georgia', fontSize: 18, color: colors.greenDark, marginBottom: 14 }}>Hall of Champions</h3>
      {pastChamps.map((champ) => <AccordionCard key={champ.year} item={champ} expanded={expandedYear === champ.year} onToggle={() => setExpandedYear(expandedYear === champ.year ? null : champ.year)} image={champPhotos[champ.year]} imagePosition={champPhotoPositions[champ.year]} isMobile={isMobile} />)}
      <h3 style={{ fontFamily: '"Playfair Display", Georgia', fontSize: 18, color: colors.greenDark, marginTop: 28, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><span>&#9971;</span> Seneca Open</h3>
      {historicalData.senecaOpens.map((seneca) => <AccordionCard key={seneca.year} item={seneca} expanded={expandedSeneca === seneca.year} onToggle={() => setExpandedSeneca(expandedSeneca === seneca.year ? null : seneca.year)} image={senecaPhotos[seneca.year]} imagePosition={senecaPhotoPositions[seneca.year]} isMobile={isMobile} seneca />)}
    </div>
  );
};

const FeatureCard = ({ item, isMobile, showResults, onToggle }) => (
  <div style={{ background: colors.yellow, borderRadius: 20, overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
    {champPhotos[item.year] && <img src={champPhotos[item.year]} alt={`${item.year} Champions`} fetchPriority="high" decoding="async" style={{ width: '100%', height: isMobile ? 240 : 260, objectFit: 'cover', objectPosition: champPhotoPositions[item.year] || 'center 30%', display: 'block' }} />}
    <div style={{ padding: 24, textAlign: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
      <span style={{ fontSize: 48 }}>&#127942;</span>
      <p style={{ fontSize: 11, color: colors.greenDark, textTransform: 'uppercase', letterSpacing: 2, marginTop: 12 }}>{item.year} Champion</p>
      <h2 style={{ fontFamily: '"Playfair Display", Georgia', fontSize: 28, color: colors.greenDark, marginTop: 4 }}>{item.results[0].name}</h2>
      <p style={{ fontSize: 15, color: colors.green, marginTop: 4, fontWeight: 600 }}>{item.results[0].score}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
        {item.results.slice(1, 3).map((player, idx) => <div key={player.name} style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 14px' }}><p style={{ fontSize: 11, color: colors.textMuted }}>{idx === 0 ? '2nd' : '3rd'}</p><p style={{ fontSize: 13, fontWeight: 600, color: colors.greenDark }}>{player.name}</p><p style={{ fontSize: 12, color: colors.green }}>{player.score}</p></div>)}
      </div>
      <button type="button" onClick={onToggle} style={{ marginTop: 16, background: colors.green, color: colors.offWhite, border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', position: 'relative', zIndex: 10 }}>{showResults ? 'Hide Results' : 'View Full Results'}</button>
      {showResults && <ResultsList results={item.results} translucent />}
    </div>
  </div>
);

const AccordionCard = ({ item, expanded, onToggle, image, imagePosition, isMobile, seneca = false }) => (
  <div style={{ background: colors.offWhite, borderRadius: 14, marginBottom: 12, border: expanded ? `2px solid ${colors.green}` : `1px solid ${colors.offWhiteMuted}`, overflow: 'hidden' }}>
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', padding: 16, cursor: 'pointer' }}>
      <div style={{ width: 50, height: 50, borderRadius: 12, background: seneca ? colors.yellow : colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><span style={{ fontFamily: '"Playfair Display", Georgia', fontSize: 16, fontWeight: 700, color: seneca ? colors.greenDark : colors.yellow }}>{item.year}</span></div>
      <div style={{ flex: 1 }}><p style={{ fontWeight: 700, color: colors.greenDark, fontSize: 16, marginBottom: 2 }}>{item.results[0].name}</p><p style={{ fontSize: 11, color: colors.textMuted }}>{seneca ? item.format : `${item.results[0].score}${item.results[0].note ? ` - ${item.results[0].note}` : ''}`}</p></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{seneca && <span style={{ background: colors.green, color: colors.offWhite, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{item.results[0].score}</span>}<span style={{ color: colors.textMuted, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>&#9660;</span></div>
    </div>
    {expanded && (
      <div style={{ borderTop: `1px solid ${colors.offWhiteMuted}` }}>
        {image && <img src={image} alt={`${item.year}`} loading="lazy" decoding="async" style={{ width: '100%', height: isMobile ? 210 : 240, objectFit: 'cover', objectPosition: imagePosition || 'center 30%', display: 'block' }} />}
        <div style={{ padding: '0 16px 16px' }}><p style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px', fontWeight: 600 }}>Full Results</p><ResultsList results={item.results} /></div>
      </div>
    )}
  </div>
);

const ResultsList = ({ results, translucent = false }) => (
  <div style={{ marginTop: 16, background: translucent ? 'rgba(255,255,255,0.6)' : 'transparent', borderRadius: 12, padding: translucent ? 12 : 0, textAlign: 'left' }}>
    {results.map((player, idx) => <div key={`${player.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < results.length - 1 ? `1px solid ${translucent ? 'rgba(0,0,0,0.1)' : colors.offWhiteMuted}` : 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: idx === 0 ? colors.yellow : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : colors.offWhiteMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: colors.greenDark }}>{player.place}</span><div><span style={{ fontSize: 14, fontWeight: 500, color: colors.greenDark }}>{player.name}</span>{player.note && <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 6 }}>({player.note})</span>}</div></div><span style={{ fontSize: 14, fontWeight: 600, color: colors.green }}>{player.score}</span></div>)}
  </div>
);
