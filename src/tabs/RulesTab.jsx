import React, { useMemo, useState } from 'react';
import { rulesData } from '../data/staticData';
import { colors } from '../theme.jsx';

export const RulesTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const filteredRules = useMemo(() => rulesData.filter((rule) => {
    const allText = [rule.title, rule.category, ...(rule.bullets || []), ...(rule.subBullets || [])].join(' ').toLowerCase();
    return allText.includes(searchQuery.toLowerCase()) && (!activeCategory || rule.category === activeCategory);
  }), [searchQuery, activeCategory]);

  const categories = [...new Set(rulesData.map((r) => r.category))];
  const getCategoryIcon = (category) => category === 'League Overview' ? '📋' : '⛳';

  return (
    <div style={{ padding: '0 16px 100px' }}>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input type="text" placeholder="Search rules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 14, border: `2px solid ${colors.green}`, background: colors.offWhite, color: colors.greenDark, fontSize: 16, outline: 'none' }} />
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, fontSize: 18 }}>&#128269;</span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {categories.map((cat) => (
          <button key={cat} type="button" onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: `1px solid ${activeCategory === cat ? colors.green : colors.offWhiteMuted}`, background: activeCategory === cat ? colors.green : colors.offWhite, color: activeCategory === cat ? colors.offWhite : colors.greenDark, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: activeCategory === cat ? 'none' : '0 2px 8px rgba(0,0,0,0.08)' }}><span>{getCategoryIcon(cat)}</span>{cat}</button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, fontWeight: 500 }}>Showing {filteredRules.length} rule{filteredRules.length !== 1 ? 's' : ''}{activeCategory && ` in ${activeCategory}`}</p>
      {filteredRules.map((rule) => (
        <div key={rule.id} style={{ background: colors.offWhite, borderRadius: 14, marginBottom: 12, border: `1px solid ${colors.offWhiteMuted}`, padding: 16, borderLeft: `4px solid ${rule.category === 'League Overview' ? colors.yellow : colors.green}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: rule.category === 'League Overview' ? colors.yellow : colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{getCategoryIcon(rule.category)}</div>
            <div style={{ flex: 1 }}><p style={{ fontWeight: 700, color: colors.greenDark, fontSize: 16, marginBottom: 2 }}>{rule.title}</p><p style={{ fontSize: 11, color: rule.category === 'League Overview' ? colors.yellow : colors.green, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{rule.category}</p></div>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc' }}>{(rule.bullets || []).map((bullet, i) => {
              if (typeof bullet === 'object' && bullet.highlight) {
                const [before, after] = bullet.text.split(bullet.highlight);
                return <li key={i} style={{ color: colors.textDark, fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{before}<strong style={{ color: '#cc2200', fontWeight: 700 }}>{bullet.highlight}</strong>{after}</li>;
              }
              return <li key={i} style={{ color: colors.textDark, fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{bullet}</li>;
            })}</ul>
            {rule.subBullets && <ul style={{ margin: '4px 0 0 0', paddingLeft: 36, listStyleType: 'circle' }}>{rule.subBullets.map((sub, i) => <li key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{sub}</li>)}</ul>}
            {rule.extraBullets && <ul style={{ margin: '6px 0 0 0', paddingLeft: 18, listStyleType: 'disc' }}>{rule.extraBullets.map((bullet, i) => <li key={i} style={{ color: colors.textDark, fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{bullet}</li>)}</ul>}
          </div>
        </div>
      ))}
      {filteredRules.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted }}><p style={{ fontSize: 40, marginBottom: 12 }}>&#128269;</p><p>No rules found for "{searchQuery}"</p></div>}
    </div>
  );
};
