import React, { useEffect, useRef, useState } from 'react';
import { DataBanner, ErrorState, LoadingState } from '../components/StatusBlocks';
import { parseScheduleCSV, SHEETS_URLS } from '../data/sheets';
import { useSheetData } from '../hooks/useSheetData';
import { colors } from '../theme.jsx';

export const ScheduleTab = () => {
  const { data: scheduleData = [], loading, error, isStale, lastUpdated, isOnline, refreshing, reload } = useSheetData({
    url: SHEETS_URLS.schedule,
    cacheKey: 'schedule',
    parser: parseScheduleCSV,
    fallbackData: [],
  });
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
    };
  }, []);

  if (loading && scheduleData.length === 0) return <LoadingState label="Loading schedule..." />;
  if (scheduleData.length === 0) return <ErrorState message={error || 'Unable to load schedule'} onRetry={reload} />;

  const upcomingGames = scheduleData.filter((g) => g.status === 'upcoming' && !g.isSpecialEvent);
  const completedGames = scheduleData.filter((g) => g.status === 'completed' && !g.isSpecialEvent);
  const filteredUpcoming = selectedWeek === 'all' ? upcomingGames.slice(1) : upcomingGames.filter((g) => g.week === selectedWeek);

  const formatDateLong = (dateStr) => {
    const [month, day] = dateStr.split(' ');
    const monthNames = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };
    const suffix = day === '1' || day === '21' || day === '31' ? 'st' : day === '2' || day === '22' ? 'nd' : day === '3' || day === '23' ? 'rd' : 'th';
    return `${monthNames[month]} ${day}${suffix}`;
  };

  return (
    <div style={{ padding: '0 16px 100px' }}>
      <DataBanner error={error} isStale={isStale} lastUpdated={lastUpdated} isOnline={isOnline} refreshing={refreshing} onRefresh={reload} />
      {upcomingGames.length > 0 && <NextRoundCard game={upcomingGames[0]} formatDateLong={formatDateLong} />}
      {upcomingGames.length > 1 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: '"Playfair Display", Georgia', fontSize: 16, color: colors.greenDark }}>Upcoming Rounds</h3>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button type="button" onClick={() => setShowDropdown((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: colors.offWhite, border: `1px solid ${colors.green}`, borderRadius: 10, color: colors.greenDark, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {selectedWeek === 'all' ? 'All Weeks' : `Week ${selectedWeek}`}
                <span style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease', fontSize: 10 }}>&#9660;</span>
              </button>
              {showDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: colors.offWhite, border: `1px solid ${colors.green}`, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 180, maxHeight: 250, overflowY: 'auto' }}>
                  <FilterButton active={selectedWeek === 'all'} onClick={() => { setSelectedWeek('all'); setShowDropdown(false); }}>All Weeks</FilterButton>
                  {upcomingGames.slice(1).map((game, idx) => <FilterButton key={`filter-${game.week}-${idx}`} active={selectedWeek === game.week} onClick={() => { setSelectedWeek(game.week); setShowDropdown(false); }}>Week {game.week} - {game.date}</FilterButton>)}
                </div>
              )}
            </div>
          </div>
          {filteredUpcoming.map((game, index) => <RoundCard key={`${game.week}-${index}`} game={game} formatDateLong={formatDateLong} />)}
        </>
      )}
      {completedGames.length > 0 && (
        <>
          <h3 style={{ fontFamily: '"Playfair Display", Georgia', fontSize: 16, color: colors.greenDark, marginTop: 24, marginBottom: 12 }}>Completed</h3>
          {completedGames.map((game, index) => <CompletedCard key={`completed-${game.week}-${index}`} game={game} />)}
        </>
      )}
    </div>
  );
};

const FilterButton = ({ active, onClick, children }) => <button type="button" onClick={onClick} style={{ width: '100%', padding: '10px 14px', border: 'none', borderTop: `1px solid ${colors.offWhiteMuted}`, background: active ? colors.green : 'transparent', color: active ? colors.offWhite : colors.greenDark, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>{children}</button>;

const CourseBlock = ({ course }) => !course ? null : (
  <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
    <p style={{ fontFamily: '"Playfair Display", Georgia', fontSize: 18, color: colors.greenDark, fontWeight: 600 }}>{course.name}</p>
    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>{course.groups.map((g) => <span key={g} style={{ background: colors.green, color: colors.offWhite, padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Group {g}</span>)}</div>
  </div>
);

const NextRoundCard = ({ game, formatDateLong }) => (
  <div style={{ background: colors.yellow, borderRadius: 20, padding: 20, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.2 }}>&#9971;</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div>
        <p style={{ fontSize: 11, color: colors.greenDark, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 4 }}>Next Round</p>
        <p style={{ fontSize: 14, color: colors.green, fontWeight: 500 }}>{formatDateLong(game.date)}</p>
      </div>
      <div style={{ background: colors.green, color: colors.offWhite, padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>Week {game.week}</div>
    </div>
    <CourseBlock course={game.course1} />
    <CourseBlock course={game.course2} />
  </div>
);

const RoundCard = ({ game, formatDateLong }) => (
  <div style={{ background: colors.offWhite, borderRadius: 14, marginBottom: 12, border: `1px solid ${colors.offWhiteMuted}`, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: `1px solid ${colors.offWhiteMuted}` }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: colors.green, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><span style={{ fontSize: 10, color: colors.yellow }}>WK</span><span style={{ fontSize: 16, fontWeight: 700, color: colors.offWhite, fontFamily: '"Playfair Display", Georgia' }}>{game.week}</span></div>
      <div style={{ flex: 1 }}><p style={{ fontWeight: 600, color: colors.greenDark, fontSize: 14 }}>{formatDateLong(game.date)}</p></div>
    </div>
    <div style={{ padding: '10px 14px 14px' }}><CourseBlock course={game.course1} /><CourseBlock course={game.course2} /></div>
  </div>
);

const CompletedCard = ({ game }) => (
  <div style={{ background: colors.offWhiteMuted, borderRadius: 12, marginBottom: 10, overflow: 'hidden', opacity: 0.85 }}>
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: `1px solid ${colors.offWhite}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, color: colors.offWhite, fontSize: 14 }}>&#10003;</div>
      <div style={{ flex: 1 }}><p style={{ fontWeight: 500, color: colors.textMuted, fontSize: 13 }}>Week {game.week} - {game.date}</p></div>
    </div>
    <div style={{ padding: '8px 12px 12px' }}>
      {[game.course1, game.course2].filter(Boolean).map((course) => <div key={course.name} style={{ marginBottom: 8 }}><p style={{ fontWeight: 600, color: colors.textMuted, fontSize: 13 }}>{course.name}</p><div style={{ display: 'flex', gap: 4, marginTop: 3 }}>{course.groups.map((g) => <span key={g} style={{ background: colors.textMuted, color: colors.offWhite, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>Group {g}</span>)}</div></div>)}
    </div>
  </div>
);
