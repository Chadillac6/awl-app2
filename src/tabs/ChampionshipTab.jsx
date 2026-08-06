import React from 'react';
import { DataBanner } from '../components/StatusBlocks.jsx';
import { championshipFallback, championshipPayouts } from '../data/championshipData.js';
import { parseChampionshipCSV, SHEETS_URLS } from '../data/sheets.js';
import { useSheetData } from '../hooks/useSheetData.js';
import { isChampionshipPreviewRequest } from '../lib/championshipMode.js';
import { colors } from '../themeTokens.js';

const cream = '#fbf5e8';
const paper = '#fffdf8';
const line = 'rgba(10,92,46,0.15)';
const serif = '"Playfair Display", Georgia, serif';

const formatDateBadge = (value) => {
  const match = String(value ?? '').match(/(\d{1,2})[/-](\d{1,2})/);
  return match ? { month: Number(match[1]) === 8 ? 'AUG' : match[1], day: match[2] } : { month: '', day: '' };
};

const normalizeTime = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return 'TBD';
  return /am|pm/i.test(text) ? text : `${text} AM`;
};

const scoreText = (value) => Number.isFinite(value) ? String(value) : '—';

const SectionLabel = ({ children }) => (
  <h2 style={{ margin: '24px 4px 10px', color: '#b68716', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{children}</h2>
);

const EventCard = ({ events }) => (
  <section style={{ background: paper, border: `1px solid ${line}`, borderRadius: 20, padding: 15, boxShadow: '0 8px 24px rgba(10,92,46,0.08)' }}>
    <p style={{ color: '#b68716', fontSize: 9, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>Three championship events</p>
    <h3 style={{ margin: '3px 0 6px', color: colors.greenDark, fontFamily: serif, fontSize: 22 }}>Weekend Schedule</h3>
    {events.map((event, index) => {
      const badge = formatDateBadge(event.date);
      const ceremony = /award/i.test(event.name);
      return (
        <div key={`${event.name}-${event.date}`} data-testid={`championship-event-${index}`} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 11, alignItems: 'center', padding: '12px 0', borderTop: index ? `1px solid ${line}` : 'none', ...(ceremony ? { background: '#fbf0cf', borderRadius: 12, margin: '5px -5px -4px', padding: '12px 5px' } : {}) }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.greenDark, color: colors.offWhite, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
            <span style={{ color: colors.yellow, fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>{badge.month}</span>
            <strong style={{ fontFamily: serif, fontSize: 19, lineHeight: 1 }}>{badge.day}</strong>
          </div>
          <div>
            <strong style={{ color: colors.greenDark, fontSize: 14 }}>{ceremony ? event.name : event.venue}</strong>
            <p style={{ marginTop: 2, color: colors.textMuted, fontSize: 10 }}>{ceremony ? event.address : `${event.name}${event.details ? ` · ${event.details}` : ''}`}</p>
            {ceremony && event.details && <p style={{ marginTop: 4, color: colors.greenDark, fontSize: 10, fontWeight: 700, lineHeight: 1.35 }}>{event.details}</p>}
          </div>
          <span style={{ padding: '7px 8px', borderRadius: 10, background: '#eef4ef', color: colors.greenDark, fontSize: 10, fontWeight: 700 }}>{normalizeTime(event.time)}</span>
        </div>
      );
    })}
  </section>
);

const Payouts = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
    {championshipPayouts.map((payout) => (
      <div key={payout.label} style={{ minHeight: 92, padding: 13, borderRadius: 16, border: payout.featured ? 'none' : `1px solid ${line}`, background: payout.featured ? 'linear-gradient(145deg, #bd8a19, #d7a62d)' : paper, color: payout.featured ? '#fff' : colors.greenDark }}>
        <small style={{ display: 'block', color: payout.featured ? '#fff7dc' : colors.textMuted, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{payout.label}</small>
        <strong style={{ display: 'block', marginTop: 6, fontFamily: serif, fontSize: payout.featured ? 30 : 26 }}>{payout.amount}</strong>
        <span style={{ color: payout.featured ? '#fff8df' : colors.textMuted, fontSize: 9 }}>{payout.detail}</span>
      </div>
    ))}
  </div>
);

const Groupings = ({ groups }) => (
  <div>
    <div style={{ marginBottom: 9, padding: '10px 12px', border: '1px solid rgba(183,135,22,0.34)', borderRadius: 14, background: '#fbf0cf', color: colors.greenDark, textAlign: 'center' }}>
      <strong style={{ display: 'block', fontFamily: serif, fontSize: 16 }}>Everyone arrive around 6:00 AM</strong>
      <span style={{ display: 'block', marginTop: 2, color: colors.textMuted, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Be checked in and ready to play</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
      {groups.map((group) => (
        <section key={group.name} style={{ overflow: 'hidden', border: `1px solid ${line}`, borderRadius: 15, background: paper }}>
          <header style={{ padding: 10, background: '#eef4ef', color: colors.greenDark, fontSize: 11, fontWeight: 700 }}>
            {group.name}
          </header>
          <ul style={{ listStyle: 'none', margin: 0, padding: '7px 10px 10px' }}>
            {group.players.map((player) => <li key={player} style={{ padding: '4px 0', borderBottom: '1px solid rgba(10,92,46,0.08)', color: colors.greenDark, fontSize: 11, fontWeight: 700 }}>{player}</li>)}
          </ul>
        </section>
      ))}
    </div>
  </div>
);

const ChampionshipLeaderboard = ({ players }) => (
  <section style={{ padding: 15, border: `1px solid ${line}`, borderRadius: 20, background: paper, boxShadow: '0 8px 24px rgba(10,92,46,0.08)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 12 }}>
      <div><p style={{ color: '#b68716', fontSize: 9, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>Total Net Scores</p><h3 style={{ marginTop: 3, color: colors.greenDark, fontFamily: serif, fontSize: 22 }}>Leaderboard</h3></div>
      <p style={{ color: colors.textMuted, fontSize: 9, textAlign: 'right' }}>Automatically sorted<br />low to high</p>
    </div>
    <div style={{ overflow: 'hidden', border: `1px solid ${line}`, borderRadius: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 38px 38px 42px', gap: 4, padding: '9px 10px', background: '#eef4ef', color: colors.greenDark, fontSize: 9, fontWeight: 700 }}><span>#</span><span>Player</span><span>R1</span><span>R2</span><span>Total</span></div>
      {players.map((player, index) => (
        <div key={player.name} data-testid="championship-leaderboard-row" data-player={player.name} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 38px 38px 42px', gap: 4, alignItems: 'center', padding: '9px 10px', borderTop: `1px solid ${line}`, fontSize: 10 }}>
          <span>{index + 1}</span><strong style={{ color: colors.greenDark }}>{player.name}</strong><span>{scoreText(player.round1Net)}</span><span>{scoreText(player.round2Net)}</span><strong style={{ padding: '4px 3px', borderRadius: 6, background: '#f5ecd4', color: colors.greenDark, textAlign: 'center' }}>{scoreText(player.weekendNet)}</strong>
        </div>
      ))}
    </div>
  </section>
);

const Rules = ({ rules }) => (
  <section style={{ overflow: 'hidden', border: `1px solid ${line}`, borderRadius: 20, background: paper, boxShadow: '0 8px 24px rgba(10,92,46,0.08)' }}>
    <h3 style={{ padding: 15, color: colors.greenDark, fontFamily: serif, fontSize: 22 }}>The rules that decide it</h3>
    {rules.map((rule, index) => (
      <div key={`${rule.number}-${rule.name}`} style={{ display: 'flex', gap: 11, padding: '11px 15px', borderTop: `1px solid ${line}` }}>
        <span style={{ width: 26, height: 26, flex: '0 0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', background: colors.greenDark, color: colors.yellow, fontFamily: serif, fontSize: 11, fontWeight: 700 }}>{rule.number || index + 1}</span>
        <div><strong style={{ color: colors.greenDark, fontSize: 11 }}>{rule.name}</strong><p style={{ marginTop: 2, color: colors.textMuted, fontSize: 9, lineHeight: 1.4 }}>{rule.text}</p></div>
      </div>
    ))}
  </section>
);

export const ChampionshipTab = () => {
  const previewMode = import.meta.env.DEV && isChampionshipPreviewRequest();
  const { data, loading, error, isStale, lastUpdated, isOnline, refreshing, reload } = useSheetData({
    url: previewMode ? '/championship-preview.csv' : SHEETS_URLS.championship,
    cacheKey: 'championship',
    parser: parseChampionshipCSV,
    fallbackData: championshipFallback,
  });
  const championship = data?.groups?.length ? data : championshipFallback;

  return (
    <div data-testid="championship-page" style={{ padding: '0 14px 100px', background: cream }}>
      <DataBanner error={error} isStale={isStale} lastUpdated={lastUpdated} isOnline={isOnline} refreshing={refreshing} onRefresh={reload} />
      <section style={{ overflow: 'hidden', padding: '14px 16px 18px', border: '1px solid rgba(183,135,22,0.48)', borderRadius: 24, background: 'radial-gradient(circle at 50% 30%, #fffdf8 0%, #f6ead0 72%, #ead39a 100%)', textAlign: 'center', boxShadow: '0 16px 38px rgba(29,63,48,0.14)' }}>
        <p style={{ color: colors.greenDark, fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase' }}>● &nbsp; Championship Mode Engaged</p>
        <img src="/awl-championship-2026.png" alt="Fifth Annual AWL Championship, August 8th and 9th, 2026" style={{ display: 'block', width: '100%', maxWidth: 278, aspectRatio: '1', margin: '4px auto -1px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
        <p style={{ margin: 0, color: colors.greenDark, fontFamily: serif, fontSize: 17, fontStyle: 'italic', fontWeight: 600 }}>Five years. Two rounds. One champion.</p>
        <div style={{ width: 260, maxWidth: '100%', margin: '15px auto 0', padding: '10px 13px 8px', borderTop: '1px solid rgba(183,135,22,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ color: colors.greenDark, fontFamily: serif, fontSize: 8, lineHeight: 1.15, letterSpacing: 1.3, fontWeight: 700 }}>PRESENTED<br />BY</span>
          <img src="/anderson-heating-cooling.svg" alt="Anderson Heating and Cooling" style={{ width: 138, maxHeight: 43, objectFit: 'contain' }} />
        </div>
      </section>
      <SectionLabel>Championship Weekend</SectionLabel><EventCard events={championship.events} />
      <SectionLabel>Live Championship Leaderboard</SectionLabel><ChampionshipLeaderboard players={championship.leaderboard} />
      <SectionLabel>Championship Groupings</SectionLabel><Groupings groups={championship.groups} />
      <SectionLabel>Championship Rules</SectionLabel><Rules rules={championship.rules} />
      <SectionLabel>What’s at Stake</SectionLabel><Payouts />
      {loading && <p style={{ marginTop: 10, color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>Refreshing championship details…</p>}
    </div>
  );
};
