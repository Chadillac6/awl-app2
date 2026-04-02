const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYDHpV6_tlPDxHOZXV4SBIekDi0DJgeMjqufVC2WEmmtQ5UMP-M8Bfb_u6qRe1t6kg8uv9EpsJupLg/pub';
const sheetURL = (gid) => `${SHEET_BASE}?gid=${gid}&single=true&output=csv`;

export const SHEETS_URLS = {
  schedule: sheetURL('900398120'),
  leaderboard: sheetURL('483982929'),
  stats: sheetURL('1427498880'),
};

export const defaultWeekHeaders = ['1', '2', '3', '4', 'S.O.', '5', '6', '7', '8', '9', '10', '11', '12'];

const parseNumber = (value, fallback = 0) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
};

const safeText = (value) => String(value ?? '').trim();

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
  const { attempts = 3, timeoutMs = 8000 } = options;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
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
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    } finally {
      clearTimeout(timeoutId);
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
      schedule.push({
        week: weekNum || 'EVENT',
        date: displayDate,
        status: isCompleted ? 'completed' : 'upcoming',
        isSpecialEvent: true,
        eventName: groupA,
        course1: { name: groupA, groups: ['A', 'B', 'C', 'D'] },
        course2: null,
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
    schedule.push({
      week: weekNum,
      date: displayDate,
      status: isCompleted ? 'completed' : 'upcoming',
      isSpecialEvent: false,
      course1: courseNames[0] ? { name: courseNames[0], groups: courses[courseNames[0]] } : null,
      course2: courseNames[1] ? { name: courseNames[1], groups: courses[courseNames[1]] } : null,
    });
  }

  return schedule;
};

export const parseLeaderboardCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const leaderboard = { groupA: [], groupB: [], groupC: [], groupD: [] };
  const leagueStats = { birdieLeader: { name: '', count: 0 }, totalBirdies: 0, weeklyLowWinners: [] };
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
      for (let j = kingIdx; j < row.length; j += 1) {
        const match = row[j]?.match(/([A-Za-z']+)\s*\((\d+)\)/);
        if (match) {
          leagueStats.birdieLeader = { name: match[1], count: parseInt(match[2], 10) };
          break;
        }
      }
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

export const parseStatsCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const statsData = [];
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
  if (headerRowIndex === -1) return { players: statsData, lowestNetRecord, lowestGrossRecord, mostBirdiesRecord };

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const name = row[1];
    if (row.some((cell) => cell?.includes('All Time'))) break;
    if (!name || name.trim() === '') continue;

    const totalGross = parseNumber(row[2]);
    if (totalGross <= 0) continue;

    statsData.push({
      player: name,
      totalGross,
      avgGross: parseNumber(row[3]),
      totalNet: parseNumber(row[4]),
      avgNet: parseNumber(row[5]),
      avgPts: parseNumber(row[6]),
      avgHdcp: parseNumber(row[7]),
      birdies: parseInt(row[8], 10) || 0,
      missedWeeks: parseInt(row[9], 10) || 0,
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
  lowestGrossRecord = extractNamedScore('lowest gross');
  mostBirdiesRecord = extractNamedScore('most birdies');

  return { players: statsData, lowestNetRecord, lowestGrossRecord, mostBirdiesRecord };
};
