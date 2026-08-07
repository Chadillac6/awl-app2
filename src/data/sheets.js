import { APP_SHEET_CSV_URLS, PUBLISHED_SHEET_CSV_URLS } from './sheetSources.js';

export const SHEETS_URLS = typeof window === 'undefined' ? PUBLISHED_SHEET_CSV_URLS : APP_SHEET_CSV_URLS;

export const defaultWeekHeaders = ['1', '2', '3', '4', 'S.O.', '5', '6', '7', '8', '9', '10', '11', '12'];

const parseNumber = (value, fallback = 0) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
};

const safeText = (value) => String(value ?? '').trim();

const normalizeBirdieKingName = (rawName) => {
  const cleaned = safeText(rawName).replace(/^Birdie King:\s*/i, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '—';

  if (/\s+(?:&|and)\s+/i.test(cleaned) || cleaned.includes(',')) return cleaned;

  const tokens = cleaned.split(' ').filter(Boolean);
  if (tokens.length >= 4) return 'Many';
  return tokens[0] || '—';
};

const formatBirdieKingCount = (count) => {
  if (!Number.isFinite(count)) return '—';
  return `${count} Birdie${count === 1 ? '' : 's'}`;
};

const csvFieldToString = (field) => {
  if (field == null) return '';
  return String(field).replace(/""/g, '"').trim();
};

export const parseCSV = (csvText) => {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(csvFieldToString(current));
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(csvFieldToString(current));
      if (row.some((field) => field !== '')) rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(csvFieldToString(current));
    if (row.some((field) => field !== '')) rows.push(row);
  }

  return rows;
};

export const fetchTextWithRetry = async (url, options = {}) => {
  const { attempts = 3, timeoutMs = 8000, signal } = options;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) throw signal.reason ?? new DOMException('Request aborted', 'AbortError');
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(signal.reason);
    signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw signal.reason ?? error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromCaller);
    }
  }

  throw lastError;
};

export const parseScheduleCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const schedule = [];
  const currentYear = new Date().getFullYear();
  const firstScheduleRowIndex = rows.findIndex((row) => {
    const week = String(row[0] || '').trim();
    const date = String(row[1] || '').trim();
    return (week === 'MAJOR' || /^\d+$/.test(week)) && /^\d{1,2}-\d{1,2}$/.test(date);
  });

  if (firstScheduleRowIndex === -1) return schedule;

  for (let i = firstScheduleRowIndex; i < rows.length; i += 1) {
    const row = rows[i];
    const weekNum = row[0];
    const dateStr = row[1];
    const groupA = row[2] || '';
    const groupB = row[3] || '';
    const groupC = row[4] || '';
    const groupD = row[5] || '';

    if (!dateStr || groupA.toLowerCase().includes('bye')) continue;

    const [month, day] = dateStr.split('-').map(Number);
    const roundDate = new Date(currentYear, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isCompleted = roundDate < today;
    const isSpecialEvent = weekNum === 'MAJOR' || weekNum === '' || groupA.toLowerCase().includes('seneca') || groupA.toLowerCase().includes('championship');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[month - 1]} ${day}`;

    if (isSpecialEvent) {
      const eventName = groupA.trim();
      const normalizedEventName = eventName.toLowerCase();
      const allGroups = ['A', 'B', 'C', 'D'];
      const isSeneca = normalizedEventName.includes('seneca');
      const isChampionship = normalizedEventName.includes('championship');
      const eventDate = isSeneca
        ? new Date(currentYear, 4, 30)
        : isChampionship
          ? new Date(currentYear, 7, 8)
          : roundDate;
      const eventCourses = isChampionship
        ? [
            { name: 'Shawnee Hills', date: 'Aug 8', groups: allGroups },
            { name: 'Pleasant Valley Country Club', date: 'Aug 9', groups: allGroups },
          ]
        : [{ name: isSeneca ? 'Seneca Open' : eventName, date: isSeneca ? 'May 30' : displayDate, groups: allGroups }];

      schedule.push({
        week: weekNum || (isChampionship ? 'CHAMPIONSHIP' : 'EVENT'),
        date: isSeneca ? 'May 30' : isChampionship ? 'Aug 8' : displayDate,
        endDate: isChampionship ? 'Aug 9' : null,
        status: eventDate < today ? 'completed' : 'upcoming',
        isSpecialEvent: true,
        eventName: isSeneca ? 'Seneca Open' : isChampionship ? 'Championship' : eventName,
        courses: eventCourses,
        course1: eventCourses[0],
        course2: eventCourses[1] ?? null,
      });
      continue;
    }

    const courses = {};
    [['A', groupA], ['B', groupB], ['C', groupC], ['D', groupD]].forEach(([group, course]) => {
      if (!course) return;
      if (!courses[course]) courses[course] = [];
      courses[course].push(group);
    });

    const courseNames = Object.keys(courses);
    const courseList = courseNames.map((name) => ({ name, groups: courses[name] }));
    schedule.push({
      week: weekNum,
      date: displayDate,
      status: isCompleted ? 'completed' : 'upcoming',
      isSpecialEvent: false,
      courses: courseList,
      course1: courseList[0] ?? null,
      course2: courseList[1] ?? null,
    });
  }

  return schedule;
};

const findSection = (rows, label) => rows.findIndex((row) => safeText(row[0]).toUpperCase() === label);
const isBlankRow = (row = []) => row.every((cell) => safeText(cell) === '');
const optionalNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const championshipScore = (value) => {
  const text = safeText(value).toUpperCase();
  if (text === 'DNP' || text === 'DNF') return text;
  return optionalNumber(value);
};

export const parseChampionshipCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const eventsStart = findSection(rows, 'WEEKEND EVENTS');
  const rulesStart = findSection(rows, 'CHAMPIONSHIP RULES');
  const groupsStart = findSection(rows, 'GROUPINGS & TEE TIMES');
  const handicapsStart = findSection(rows, 'WEEKEND HANDICAPS');
  const leaderboardStart = findSection(rows, 'CHAMPIONSHIP LEADERBOARD');
  const finalResultsStart = findSection(rows, 'FINAL RESULTS');
  const controlsStart = findSection(rows, 'MODE & NOTIFICATION CONTROLS');

  const nextSectionStart = (start, ...candidates) => candidates
    .filter((candidate) => candidate > start)
    .sort((a, b) => a - b)[0] ?? -1;

  const sectionRows = (start, next) => {
    if (start < 0) return [];
    return rows.slice(start + 2, next < 0 ? rows.length : next).filter((row) => !isBlankRow(row));
  };

  const eventsEnd = nextSectionStart(eventsStart, rulesStart, groupsStart, handicapsStart, leaderboardStart, finalResultsStart, controlsStart);
  const events = sectionRows(eventsStart, eventsEnd).map((row) => ({
    name: safeText(row[0]),
    date: safeText(row[1]),
    time: safeText(row[2]),
    venue: safeText(row[3]),
    address: safeText(row[4]),
    details: safeText(row[5]),
  })).filter((event) => event.name);

  const rulesEnd = nextSectionStart(rulesStart, groupsStart, handicapsStart, leaderboardStart, finalResultsStart, controlsStart);
  const rules = sectionRows(rulesStart, rulesEnd).map((row) => ({
    number: safeText(row[0]),
    name: safeText(row[1]),
    text: safeText(row[2]),
  })).filter((rule) => rule.name || rule.text);

  const groupsEnd = nextSectionStart(groupsStart, handicapsStart, leaderboardStart, finalResultsStart, controlsStart);
  const groups = sectionRows(groupsStart, groupsEnd).map((row) => ({
    name: safeText(row[0]),
    teeTime: safeText(row[1]),
    players: row.slice(2, 6).map(safeText).filter(Boolean),
    notes: safeText(row[6]),
  })).filter((group) => /^Group\s+\d+$/i.test(group.name) && group.players.length);

  const handicapsEnd = nextSectionStart(handicapsStart, leaderboardStart, finalResultsStart, controlsStart);
  const handicapsByPlayer = Object.fromEntries(sectionRows(handicapsStart, handicapsEnd)
    .map((row) => [safeText(row[0]).toLowerCase(), {
      round1: optionalNumber(row[1]),
      round2: optionalNumber(row[2]),
    }])
    .filter(([name]) => name));

  groups.forEach((group) => {
    group.handicaps = Object.fromEntries(group.players.map((player) => [
      player,
      handicapsByPlayer[player.toLowerCase()] ?? { round1: null, round2: null },
    ]));
  });

  const groupOrder = new Map(groups.flatMap((group, groupIndex) => group.players.map((name, playerIndex) => [
    name.toLowerCase(),
    (groupIndex * 4) + playerIndex,
  ])));
  const leaderboardEnd = nextSectionStart(leaderboardStart, handicapsStart, finalResultsStart, controlsStart);
  const leaderboard = sectionRows(leaderboardStart, leaderboardEnd).map((row) => {
    const round1Net = championshipScore(row[3]);
    const round2Net = championshipScore(row[4]);
    const enteredTotal = championshipScore(row[5]);
    const didNotFinish = round1Net === 'DNP' || round2Net === 'DNP' || enteredTotal === 'DNF';

    return {
      position: optionalNumber(row[0]),
      name: safeText(row[1]),
      group: safeText(row[2]),
      round1Net,
      round2Net,
      weekendNet: didNotFinish ? 'DNF' : enteredTotal,
      grossTotal: optionalNumber(row[6]),
      notes: safeText(row[7]),
    };
  }).filter((player) => player.name);

  leaderboard.sort((a, b) => {
    const aDnf = a.weekendNet === 'DNF';
    const bDnf = b.weekendNet === 'DNF';
    if (aDnf !== bDnf) return aDnf ? 1 : -1;
    if (aDnf && bDnf) return a.name.localeCompare(b.name);
    const aScored = Number.isFinite(a.weekendNet) || Number.isFinite(a.round1Net);
    const bScored = Number.isFinite(b.weekendNet) || Number.isFinite(b.round1Net);
    if (aScored !== bScored) return aScored ? -1 : 1;
    const aScore = a.weekendNet ?? a.round1Net ?? Infinity;
    const bScore = b.weekendNet ?? b.round1Net ?? Infinity;
    if (aScore !== bScore) return aScore - bScore;
    return (groupOrder.get(a.name.toLowerCase()) ?? 999) - (groupOrder.get(b.name.toLowerCase()) ?? 999);
  });

  const controls = Object.fromEntries(sectionRows(controlsStart, -1)
    .map((row) => [safeText(row[0]), safeText(row[1])])
    .filter(([key]) => key));

  return { events, rules, groups, leaderboard, controls };
};

export const parseLeaderboardCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const leaderboard = { groupA: [], groupB: [], groupC: [], groupD: [] };
  const leagueStats = { birdieLeader: { raw: '', name: '—', count: null, label: '—' }, totalBirdies: 0, weeklyLowWinners: [] };
  let currentGroup = null;
  let weekHeaders = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (row[3] === 'Week') {
      weekHeaders = row.slice(4).filter((h) => h && h !== '');
      continue;
    }

    const rowStr = row.join(' ');
    if (rowStr.includes('Group A') && row[3] === 'Total') currentGroup = 'groupA';
    else if (rowStr.includes('Group B')) currentGroup = 'groupB';
    else if (rowStr.includes('Group C')) currentGroup = 'groupC';
    else if (rowStr.includes('Group D')) currentGroup = 'groupD';
    if (rowStr.includes('Weekly Low')) currentGroup = null;

    const rank = parseInt(row[1], 10);
    const name = safeText(row[2]);
    const total = parseNumber(row[3], NaN);

    if (currentGroup && rank && name && !Number.isNaN(total)) {
      const weeks = row.slice(4).map((val) => {
        const num = parseFloat(val);
        return Number.isNaN(num) ? 0 : num;
      });
      leaderboard[currentGroup].push({ rank, name, total, weeks: weeks.slice(0, weekHeaders.length) });
    }

    if (row.some((cell) => cell?.includes('Total Birdies:'))) {
      const birdieIdx = row.findIndex((cell) => cell?.includes('Total Birdies:'));
      for (let j = birdieIdx + 1; j < Math.min(birdieIdx + 4, row.length); j += 1) {
        const num = parseInt(row[j], 10);
        if (!Number.isNaN(num) && num > 0) {
          leagueStats.totalBirdies = num;
          break;
        }
      }
    }

    if (row.some((cell) => cell?.includes('Birdie King:'))) {
      const kingIdx = row.findIndex((cell) => cell?.includes('Birdie King:'));
      const nameParts = [];
      let count = null;

      for (let j = kingIdx + 1; j < row.length; j += 1) {
        const cell = safeText(row[j]);
        if (!cell) continue;

        const numeric = cell.match(/^\d+(?:\.\d+)?$/);
        if (numeric) {
          count = parseFloat(cell);
          break;
        }

        nameParts.push(cell.replace(/^Birdie King:\s*/i, '').trim());
      }

      const rawName = nameParts.join(' ').replace(/\s+/g, ' ').trim();
      leagueStats.birdieLeader = {
        raw: rawName,
        name: normalizeBirdieKingName(rawName),
        count,
        label: formatBirdieKingCount(count),
      };
    }

    if (row.some((cell) => cell?.includes('Weekly Low:'))) {
      const weeklyLowIdx = row.findIndex((cell) => cell?.includes('Weekly Low:'));
      const winnersByWeek = weekHeaders.map((week, idx) => {
        const rawName = row[weeklyLowIdx + 1 + idx] || '';
        return {
          week,
          rawName,
          name: rawName.replace(/\n/g, ', ').trim(),
          names: rawName.split('\n').map((value) => value.trim()).filter(Boolean),
          score: '--',
          payout: '$20',
        };
      }).filter((entry) => entry.rawName && entry.rawName.trim());

      leagueStats.weeklyLowWinners = winnersByWeek.slice(-4).reverse();
    }
  }

  return { leaderboard, leagueStats, weekHeaders };
};

const isNumericCell = (value) => {
  const text = safeText(value);
  if (!text) return false;
  return Number.isFinite(parseFloat(text));
};

const formatWeekLabel = (week) => {
  const text = safeText(week);
  if (text.toLowerCase() === 'major') return 'Seneca';
  return `Week ${text}`;
};

const splitRecordNames = (value) => safeText(value)
  .split(/\s*(?:&|,|\band\b)\s*/i)
  .map((name) => name.trim())
  .filter(Boolean);

const joinRecordNames = (names) => names.join(' & ');

const addUniqueName = (names, nextName) => {
  const normalizedNext = safeText(nextName);
  if (!normalizedNext) return;
  const exists = names.some((name) => name.toLowerCase() === normalizedNext.toLowerCase());
  if (!exists) names.push(normalizedNext);
};

const addGrossTiePlayers = (record, weeklyStatsByWeek) => {
  if (!record?.score || !weeklyStatsByWeek) return record;

  const tiedPlayers = [];
  Object.values(weeklyStatsByWeek).forEach((week) => {
    if (week?.isMajor) return;
    (week?.players ?? []).forEach((player) => {
      if (parseNumber(player?.gross, NaN) === record.score) addUniqueName(tiedPlayers, player.player);
    });
  });

  if (tiedPlayers.length === 0) return record;

  const namedPlayers = splitRecordNames(record.player);
  const combined = [];
  tiedPlayers.forEach((name) => addUniqueName(combined, name));
  namedPlayers.forEach((name) => addUniqueName(combined, name));

  return { ...record, player: joinRecordNames(combined) };
};

const buildWeeklyStats = (rows = []) => {
  const weekRow = rows[0] ?? [];
  const headerRow = rows[1] ?? [];
  const playerRows = rows.slice(2).filter((row) => safeText(row[0]) && safeText(row[1]));
  const starts = [];

  for (let index = 3; index < weekRow.length; index += 1) {
    const week = safeText(weekRow[index]);
    if (week) starts.push({ week, startIndex: index });
  }

  const weekOptions = [];
  const weeklyStatsByWeek = {};

  starts.forEach((entry, idx) => {
    const endIndex = starts[idx + 1]?.startIndex ?? headerRow.length;
    const blockHeaders = headerRow.slice(entry.startIndex, endIndex).map((cell) => safeText(cell).toLowerCase());
    const findOffset = (...labels) => blockHeaders.findIndex((header) => labels.includes(header));
    const isMajor = entry.week.toLowerCase() === 'major' || findOffset('rd1') !== -1;

    const scoreOffset = findOffset('score');
    const hdcpOffset = findOffset('hdcp', 'handicap');
    const netOffset = findOffset('net');
    const birdiesOffset = findOffset('birdies');
    const pointsOffset = blockHeaders.findIndex((header) => header.startsWith('pts'));
    const rd1Offset = findOffset('rd1');
    const rd2Offset = findOffset('rd2');
    const totalOffset = findOffset('total');

    const primaryScoreOffset = isMajor ? totalOffset : scoreOffset;
    if (primaryScoreOffset === -1) return;

    const hasScores = playerRows.some((row) => isNumericCell(row[entry.startIndex + primaryScoreOffset]));
    if (!hasScores) return;

    const value = entry.week.toLowerCase() === 'major' ? 'major' : entry.week;
    const label = formatWeekLabel(entry.week);
    weekOptions.push({ value, label, isMajor });

    const readNumber = (row, offset) => (offset === -1 ? 0 : parseNumber(row[entry.startIndex + offset]));
    const readInteger = (row, offset) => (offset === -1 ? 0 : parseInt(row[entry.startIndex + offset], 10) || 0);

    weeklyStatsByWeek[value] = {
      value,
      label,
      isMajor,
      players: playerRows.map((row) => {
        const base = { player: safeText(row[1]) };
        if (isMajor) {
          return {
            ...base,
            rd1: readNumber(row, rd1Offset),
            rd2: readNumber(row, rd2Offset),
            total: readNumber(row, totalOffset),
            birdies: readInteger(row, birdiesOffset),
            points: readNumber(row, pointsOffset),
          };
        }

        return {
          ...base,
          gross: readNumber(row, scoreOffset),
          hdcp: readNumber(row, hdcpOffset),
          net: readNumber(row, netOffset),
          birdies: readInteger(row, birdiesOffset),
          points: readNumber(row, pointsOffset),
        };
      }),
    };
  });

  return { weekOptions, weeklyStatsByWeek };
};

export const parseStatsCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const statsData = [];
  const { weekOptions, weeklyStatsByWeek } = buildWeeklyStats(rows);
  let lowestNetRecord = null;
  let lowestGrossRecord = null;
  let mostBirdiesRecord = null;
  let headerRowIndex = -1;

  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].some((cell) => cell?.includes('Total Gross'))) {
      headerRowIndex = i;
      break;
    }
  }
  if (headerRowIndex === -1) return { players: statsData, lowestNetRecord, lowestGrossRecord, mostBirdiesRecord, weekOptions, weeklyStatsByWeek };

  const headerRow = rows[headerRowIndex];
  const totalGrossIdx = headerRow.findIndex((cell) => safeText(cell).toLowerCase() === 'total gross');
  const avgGrossIdx = headerRow.findIndex((cell) => safeText(cell).toLowerCase() === 'avg gross');
  const totalNetIdx = headerRow.findIndex((cell) => safeText(cell).toLowerCase() === 'total net');
  const avgNetIdx = headerRow.findIndex((cell) => safeText(cell).toLowerCase() === 'avg net');
  const avgPtsIdx = headerRow.findIndex((cell) => safeText(cell).toLowerCase() === 'avg pts');
  const avgHdcpIdx = headerRow.findIndex((cell) => safeText(cell).toLowerCase() === 'avg hdcp');
  const birdiesIdx = headerRow.findIndex((cell) => safeText(cell).toLowerCase() === 'birdies');
  const missedWeeksIdx = headerRow.findIndex((cell) => safeText(cell).toLowerCase().startsWith('missed'));
  const playerIdx = totalGrossIdx > 0 ? totalGrossIdx - 1 : 2;

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const name = safeText(row[playerIdx]);
    if (row.some((cell) => cell?.includes('All Time'))) break;
    if (!name) continue;

    statsData.push({
      player: name,
      totalGross: parseNumber(row[totalGrossIdx]),
      avgGross: parseNumber(row[avgGrossIdx]),
      totalNet: parseNumber(row[totalNetIdx]),
      avgNet: parseNumber(row[avgNetIdx]),
      avgPts: parseNumber(row[avgPtsIdx]),
      avgHdcp: parseNumber(row[avgHdcpIdx]),
      birdies: parseInt(row[birdiesIdx], 10) || 0,
      missedWeeks: parseInt(row[missedWeeksIdx], 10) || 0,
    });
  }

  const extractNamedScore = (label) => {
    for (const row of rows) {
      const rowText = row.join(' ').toLowerCase();
      if (!rowText.includes(label)) continue;
      for (let j = 0; j < row.length; j += 1) {
        if (row[j]?.toLowerCase().includes(label)) {
          const name = row[j + 1] || '';
          const score = parseInt(row[j + 2], 10) || 0;
          if (name && score > 0) return { player: name.trim(), score };
        }
      }
    }
    return null;
  };

  lowestNetRecord = extractNamedScore('lowest net');
  lowestGrossRecord = addGrossTiePlayers(extractNamedScore('lowest gross'), weeklyStatsByWeek);
  mostBirdiesRecord = extractNamedScore('most birdies');

  return { players: statsData, lowestNetRecord, lowestGrossRecord, mostBirdiesRecord, weekOptions, weeklyStatsByWeek };
};
