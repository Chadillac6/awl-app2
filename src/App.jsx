import React, { useState, useEffect } from 'react';

// =============================================================================
// BRAND COLORS
// =============================================================================
const colors = {
  green: '#0f7a3f',
  greenDark: '#0a5c2e',
  greenLight: '#12924a',
  yellow: '#d9b44a',
  yellowLight: '#e5c56a',
  offWhite: '#f5f5f0',
  offWhiteMuted: '#e8e8e0',
  textMuted: '#7a8a7a',
  textDark: '#1a3d2a',
};

// AWL Sun Logo - 12-pointed starburst
const SunLogo = ({ size = 120, color }) => {
  // Generate 12-point starburst: 24 points alternating outer/inner radius
  const cx = 60, cy = 60, outerR = 56, innerR = 38, points = 12;
  const coords = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    coords.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <polygon points={coords.join(' ')} fill={color || colors.yellow} />
    </svg>
  );
};

// =============================================================================
// GOOGLE SHEETS CSV URLs
// =============================================================================
const SHEETS_URLS = {
  schedule: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYDHpV6_tlPDxHOZXV4SBIekDi0DJgeMjqufVC2WEmmtQ5UMP-M8Bfb_u6qRe1t6kg8uv9EpsJupLg/pub?gid=900398120&single=true&output=csv',
  leaderboard: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYDHpV6_tlPDxHOZXV4SBIekDi0DJgeMjqufVC2WEmmtQ5UMP-M8Bfb_u6qRe1t6kg8uv9EpsJupLg/pub?gid=483982929&single=true&output=csv',
  stats: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYDHpV6_tlPDxHOZXV4SBIekDi0DJgeMjqufVC2WEmmtQ5UMP-M8Bfb_u6qRe1t6kg8uv9EpsJupLg/pub?gid=1427498880&single=true&output=csv',
};

// =============================================================================
// CSV PARSING HELPERS
// =============================================================================

// Parse CSV text into array of rows
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
};

// Parse schedule CSV into app format
const parseScheduleCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const schedule = [];
  const currentYear = new Date().getFullYear();

  // Skip header rows (first 3 rows based on your sheet structure)
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    const weekNum = row[0];
    const dateStr = row[1];
    const groupA = row[2] || '';
    const groupB = row[3] || '';
    const groupC = row[4] || '';
    const groupD = row[5] || '';

    // Skip empty rows or bye weeks
    if (!dateStr || groupA.toLowerCase().includes('bye')) continue;

    // Parse date (format: "5-1" for May 1st)
    const [month, day] = dateStr.split('-').map(Number);
    const roundDate = new Date(currentYear, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isCompleted = roundDate < today;
    const isSpecialEvent = weekNum === 'MAJOR' || weekNum === '' || groupA.toLowerCase().includes('seneca') || groupA.toLowerCase().includes('championship');

    // Format date for display (e.g., "May 1")
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayDate = `${monthNames[month - 1]} ${day}`;

    if (isSpecialEvent) {
      // Handle special events (Seneca Open, Championship)
      schedule.push({
        week: weekNum || 'EVENT',
        date: displayDate,
        status: isCompleted ? 'completed' : 'upcoming',
        isSpecialEvent: true,
        eventName: groupA,
        course1: { name: groupA, groups: ['A', 'B', 'C', 'D'] },
        course2: null,
      });
    } else {
      // Regular week - group courses together
      const courses = {};

      // Group A course
      if (groupA) {
        if (!courses[groupA]) courses[groupA] = [];
        courses[groupA].push('A');
      }
      // Group B course
      if (groupB) {
        if (!courses[groupB]) courses[groupB] = [];
        courses[groupB].push('B');
      }
      // Group C course
      if (groupC) {
        if (!courses[groupC]) courses[groupC] = [];
        courses[groupC].push('C');
      }
      // Group D course
      if (groupD) {
        if (!courses[groupD]) courses[groupD] = [];
        courses[groupD].push('D');
      }

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
  }

  return schedule;
};

// Parse leaderboard CSV into app format
const parseLeaderboardCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const leaderboard = {
    groupA: [],
    groupB: [],
    groupC: [],
    groupD: [],
  };
  const leagueStats = {
    birdieLeader: { name: '', count: 0 },
    totalBirdies: 0,
    weeklyLowWinners: [],
  };

  let currentGroup = null;
  let weekHeaders = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Find week headers row (contains "Week" in column 3)
    if (row[3] === 'Week') {
      // Extract week headers from row - columns 4 onwards are weeks (1, 2, 3, 4, Major, 5, etc.)
      weekHeaders = row.slice(4).filter(h => h && h !== '');
      continue;
    }

    // Detect group headers - check if any cell contains "Group A", "Group B", etc.
    const rowStr = row.join(' ');
    if (rowStr.includes('Group A') && row[3] === 'Total') {
      currentGroup = 'groupA';
      continue;
    } else if (rowStr.includes('Group B')) {
      currentGroup = 'groupB';
      continue;
    } else if (rowStr.includes('Group C')) {
      currentGroup = 'groupC';
      continue;
    } else if (rowStr.includes('Group D')) {
      currentGroup = 'groupD';
      continue;
    }

    // Stop parsing players if we hit Weekly Low or other summary sections
    if (rowStr.includes('Weekly Low')) {
      currentGroup = null;
    }

    // Parse player rows (has rank in column 1, name in column 2, total in column 3)
    const rank = parseInt(row[1]);
    const name = row[2];
    const total = parseFloat(row[3]);

    if (currentGroup && rank && name && !isNaN(total)) {
      // Extract weekly scores (columns 4 onwards)
      const weeks = row.slice(4).map(val => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      });
      // Trim to match the number of week headers
      const trimmedWeeks = weeks.slice(0, weekHeaders.length);

      leaderboard[currentGroup].push({
        rank,
        name,
        total,
        weeks: trimmedWeeks,
      });
    }

    // Parse birdie stats (look for "Total Birdies:" and "Birdie King:")
    if (row.some(cell => cell && cell.includes('Total Birdies:'))) {
      const birdieIdx = row.findIndex(cell => cell && cell.includes('Total Birdies:'));
      if (birdieIdx >= 0) {
        // Look for the number in nearby cells (it might be 1 or 2 columns over)
        for (let j = birdieIdx + 1; j < Math.min(birdieIdx + 4, row.length); j++) {
          const num = parseInt(row[j]);
          if (!isNaN(num) && num > 0) {
            leagueStats.totalBirdies = num;
            break;
          }
        }
      }
    }
    if (row.some(cell => cell && cell.includes('Birdie King:'))) {
      const kingIdx = row.findIndex(cell => cell && cell.includes('Birdie King:'));
      if (kingIdx >= 0) {
        // Look for the value in nearby cells
        for (let j = kingIdx; j < row.length; j++) {
          const match = row[j].match(/(\w+)\s*\((\d+)\)/);
          if (match) {
            leagueStats.birdieLeader = { name: match[1], count: parseInt(match[2]) };
            break;
          }
        }
      }
    }

    // Parse weekly low winners
    if (row.some(cell => cell && cell.includes('Weekly Low:'))) {
      const weeklyLowIdx = row.findIndex(cell => cell && cell.includes('Weekly Low:'));
      // Weekly winners are in the cells after "Weekly Low:"
      const winners = row.slice(weeklyLowIdx + 1).filter(w => w && w.trim());
      // We'll store the most recent ones
      leagueStats.weeklyLowWinners = winners.slice(-4).map((name, idx) => ({
        week: weekHeaders.length - 3 + idx,
        name: name.split('\n')[0], // Handle multi-line cells
        score: '--',
        payout: '$20',
      })).reverse();
    }
  }

  return { leaderboard, leagueStats, weekHeaders };
};

// Parse stats CSV into app format
const parseStatsCSV = (csvText) => {
  const rows = parseCSV(csvText);
  const statsData = [];
  let lowestNetRecord = null;
  let lowestGrossRecord = null;
  let mostBirdiesRecord = null;

  // Find the row with stats headers (contains "Total Gross", "Avg Gross", etc.)
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(cell => cell && cell.includes('Total Gross'))) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) return { players: statsData, lowestNetRecord, lowestGrossRecord, mostBirdiesRecord };

  // Parse player stats rows (rows after header that have player names)
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[1]; // Player name is in column 1

    // Stop when we hit "All Time Record" section
    if (row.some(cell => cell && cell.includes('All Time'))) break;

    // Skip empty rows - continue, don't break
    if (!name || name.trim() === '') continue;

    const totalGross = parseFloat(row[2]) || 0;
    const avgGross = parseFloat(row[3]) || 0;
    const totalNet = parseFloat(row[4]) || 0;
    const avgNet = parseFloat(row[5]) || 0;
    const avgPts = parseFloat(row[6]) || 0;
    const avgHdcp = parseFloat(row[7]) || 0;
    const birdies = parseInt(row[8]) || 0;
    const missedWeeks = parseInt(row[9]) || 0;

    // Only add if we have valid data (name and totalGross > 0)
    if (name && totalGross > 0) {
      statsData.push({
        player: name,
        totalGross,
        avgGross,
        totalNet,
        avgNet,
        avgPts,
        avgHdcp,
        birdies,
        missedWeeks,
      });
    }
  }

  // Parse Lowest Net and Lowest Gross records from the CSV
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowText = row.join(' ').toLowerCase();

    // Look for "Lowest Net:" row
    if (rowText.includes('lowest net')) {
      for (let j = 0; j < row.length; j++) {
        if (row[j] && row[j].toLowerCase().includes('lowest net')) {
          // Name is in next column, score is column after that
          const name = row[j + 1] || '';
          const score = parseInt(row[j + 2]) || 0;
          if (name && score > 0) {
            lowestNetRecord = { player: name.trim(), score };
          }
          break;
        }
      }
    }

    // Look for "Lowest Gross:" row
    if (rowText.includes('lowest gross')) {
      for (let j = 0; j < row.length; j++) {
        if (row[j] && row[j].toLowerCase().includes('lowest gross')) {
          // Name is in next column, score is column after that
          const name = row[j + 1] || '';
          const score = parseInt(row[j + 2]) || 0;
          if (name && score > 0) {
            lowestGrossRecord = { player: name.trim(), score };
          }
          break;
        }
      }
    }

    // Look for "Most Birdies" row
    if (rowText.includes('most birdies')) {
      for (let j = 0; j < row.length; j++) {
        if (row[j] && row[j].toLowerCase().includes('most birdies')) {
          const name = row[j + 1] || '';
          const score = parseInt(row[j + 2]) || 0;
          if (name && score > 0) {
            mostBirdiesRecord = { player: name.trim(), score };
          }
          break;
        }
      }
    }
  }

  return { players: statsData, lowestNetRecord, lowestGrossRecord, mostBirdiesRecord };
};

// =============================================================================
// DATA - Static data (will add more Google Sheets fetches later)
// =============================================================================

// Default week headers (will be overridden by Google Sheets data)
const defaultWeekHeaders = ['1', '2', '3', '4', 'S.O.', '5', '6', '7', '8', '9', '10', '11', '12'];

// Leaderboard data - now fetched from Google Sheets (see LeaderboardTab component)
// Schedule data - now fetched from Google Sheets (see ScheduleTab component)

// Rules organized by category with bullet points
const rulesData = [
  // LEAGUE OVERVIEW
  { id: 1, title: 'League Structure', category: 'League Overview', bullets: [
    'A 14-week summer league with a 12-week regular season, a mid-season major, and a 36-hole championship weekend',
    'Courses and schedule are predetermined',
    'Regular season courses: Big Met, Hilliard Lake, Springvale, and Bob-O-Link',
  ]},
  { id: 2, title: 'Seneca Open', category: 'League Overview', bullets: [
    'May 30th - A mid-season, 27-hole major team event played with all members',
    'The winning team receives regular-season points',
    'Each 9 will consist of a new game:',
  ], subBullets: [
    '2-man Scramble (no handicap)',
    'Team Stroke Play (combine net score)',
    'Alt Shot (no handicap)',
  ]},
  { id: 3, title: 'Championship Weekend', category: 'League Overview', bullets: [
    "Aug 8th & 9th - Championship weekend will be played together and finish with an awards ceremony at Chad's house on Sunday afternoon (members' wives and families are welcome)",
    'Saturday at Shawnee Hills (18 holes)',
    'Sunday at Shale Creek (18 holes)',
    'The winner of championship weekend is the winner of the entire league',
  ]},
  { id: 4, title: 'Scores', category: 'League Overview', bullets: [
    'The winner of each week will receive points added to their total for the regular season',
    '18Birdies will track handicaps and be the source of truth for net scoring',
  ], subBullets: [
    'Weekly winners: 1st (4 pts), 2nd (2 pts), 3rd (1 pt)',
    'Seneca Open: 1st (6), 2nd (5), 3rd (4), 4th (3), 5th (2), 6th (1), 7th & 8th (0)',
    'End of season strokes (does not affect handicaps): 1st (4), 2nd (2), 3rd (1)',
  ]},
  { id: 5, title: 'Walking', category: 'League Overview', bullets: [
    'This is a walking league. It does not matter if you dropped acid the night before and did not get any sleep and show up to the course still drunk - you must walk',
    'Any real reason for not walking (injury) can be approved by the other members of your group',
  ]},
  { id: 6, title: 'Makeup Rounds', category: 'League Overview', bullets: [
    'If you miss a week with your group, you have 2 weeks to make up the round with anyone in the AM league',
    'You can also play ahead of the week',
    'Needs to be the same tee and the other member must sign off on the legit score',
  ]},
  { id: 7, title: '18Birdies', category: 'League Overview', bullets: [
    'Must have a handicap in 18Birdies to start or your group can decide on a manual one to begin with',
    'We will use 18Birdies for consistent handicap tracking and following scores',
    'Members must use 18Birdies in real-time so scores are all on one scorecard',
  ]},
  { id: 8, title: 'Membership Dues & Payouts', category: 'League Overview', bullets: [
    'Dues are $150 per Member',
    "Members must pay 100% of their dues before they tee off Week 1. If they tee off without paying, they will be DQ'd for said round until fully paid",
  ], subBullets: [
    '1st Place: $900',
    '2nd Place: $300',
    '3rd Place: $100',
    'Gross Winner: $100',
    'Seneca Open: $200 (split between 2)',
    'Regular Season: $140 each group',
    'Weekly Winner: $20 each week',
  ]},
  { id: 9, title: 'Birdie Pot', category: 'League Overview', bullets: [
    'For every birdie a member scores, every member will add $0.50 to a birdie pot',
    'Applies during the regular season, Seneca Open, and Championship Weekend',
    'Last person to card a birdie throughout the season receives 50% of the pot',
    'Member with the most birdies for the year receives the other 50%',
    'Tracking will be on the leaderboard',
  ]},

  // GOLF RULES
  { id: 10, title: 'Get Approvals', category: 'Golf Rules', bullets: [
    'When in doubt, ask one other person for approval',
    'This rule is applied to gimmies, ball replacements and anything else not outlined below',
  ]},
  { id: 11, title: 'Breakfast Buffet', category: 'Golf Rules', bullets: [
    'If your first drive is not in the fairway, each player is allowed to hit a 2nd shot on the first tee and choose which ball they want to use',
    'Because you might be teeing off at 6am, your first swing may be a little tight',
    'Please be mindful of the pace in the beginning',
    '1st swing only',
  ]},
  { id: 12, title: 'Gimmies', category: 'Golf Rules', bullets: [
    'Gimmies are allowed as long as 1 other person approves the pick-up',
    'No gimmies for pars or birdies - does not matter if someone says pick up',
    'Seneca Open and Championship Weekend: no gimmies for birdies, pars, or bogeys',
  ]},
  { id: 13, title: 'No White Stakes', category: 'Golf Rules', bullets: [
    'Each OOB can be played as a red stake',
    'Drop 2 club lengths from where the ball went out, OR get a line from your previous shot to where the ball went OOB',
    'Ball should never be progressed further to where the ball went',
  ]},
  { id: 14, title: 'Bumping / Plugged Balls / Wet Sandtraps', category: 'Golf Rules', bullets: [
    'No bumping or ball movement if the ball is in a hazard (red stakes, white stakes, water)',
    'Bumping is ok as long as your line is not improved and you stay on the same cut of grass (think 2in radius)',
    'If you need to move your ball more, you must get approval from 1 other person',
    'You cannot progress the ball and you cannot improve your line',
    'Standing water or mud pit in a sandtrap: ask for approval to rake and drop somewhere in the trap. The ball must be played in the trap still',
  ]},
  { id: 15, title: 'Gentleman Drops', category: 'Golf Rules', bullets: [
    'If you cannot find your ball, you must have unanimous approval by the group to get a free drop',
    'We are playing early in the morning and the sun can blind us so we need to stay flexible',
    'If not unanimous, you must drop with 1 stroke penalty',
  ]},
  { id: 16, title: 'Tie Breakers & Putt-Offs', category: 'Golf Rules', bullets: [
    'Members with a tie will split the total points available',
    'Example: Member A and Member B tied for 1st place - they would each get 3 points (6 total pts divided by 2)',
    'If there is a tie after the Seneca Open or the Championship, a putt-off will take place:',
  ], subBullets: [
    'Throw a tee - winner selects to go first or second',
    'Whoever goes 1st selects the shot',
    '3 alternative putts, marking the closest putt',
    'Winner is whoever is closer after all putts',
  ]},
  { id: 17, title: 'Concedes', category: 'Golf Rules', bullets: [
    'Pick up your ball once you are +4 for the hole to keep things moving',
    'You can also pick up at any time to automatically get a +4',
    'This helps with the pace of play if you are struggling',
  ]},
  { id: 18, title: 'Late To Your Round', category: 'Golf Rules', bullets: [
    'If you are late to your round, you will concede (+4) any holes you missed',
    'Groups should also try and delay the start by letting others go first to minimize any missed holes',
  ]},
  { id: 19, title: 'Incorrect Scores in 18Birdies', category: 'Golf Rules', bullets: [
    'If a Member inputs the incorrect score for a hole into 18Birdies and starts to play the next hole, it is a 2 stroke penalty and a warning',
    "If a Member inputs the wrong score three times during the season, they will be DQ'd for the round (3 strikes you're out rule)",
    'If you are unsure of your score, please ask the other Members for confirmation before inputting',
  ]},
  { id: 20, title: 'The Faro Rule (No Cheating)', category: 'Golf Rules', bullets: [
    'No training aids, foreign substances or non-PGA-approved equipment should be used during the round',
    'This is not a practice round but league play',
    'Any illegal equipment can result in an auto DQ for the round and future penalties if deemed necessary',
  ]},
];

// Historical championship and Seneca Open results
const historicalData = {
  championships: [
    {
      year: 2025,
      results: [
        { place: 1, name: 'Jake Taylor', score: '+1' },
        { place: 2, name: 'Sean Housel', score: '+2' },
        { place: 3, name: 'Jared Fritz', score: '+3' },
        { place: 4, name: 'Charles Martin', score: '+4' },
        { place: 5, name: 'James Stephens', score: '+4' },
        { place: 6, name: 'Nick Carpenter', score: '+4' },
        { place: 7, name: 'Tony Anderson', score: '+4' },
        { place: 8, name: 'Jon Faro', score: '+9' },
        { place: 9, name: 'Joe Fitch', score: '+10' },
        { place: 10, name: 'Richie Baker', score: '+10' },
        { place: 11, name: 'Kevin Fentner', score: '+11' },
        { place: 12, name: 'Glen Morrison', score: '+17' },
        { place: 13, name: 'Josh Houser', score: '+17' },
        { place: 14, name: 'Chad Supers', score: '+28' },
        { place: 15, name: "Ian O'Neal", score: '+31' },
      ]
    },
    {
      year: 2024,
      results: [
        { place: 1, name: 'Glen Morrison', score: '-4' },
        { place: 2, name: 'Joe Fitch', score: '-2' },
        { place: 3, name: 'James Stephens', score: '+1' },
        { place: 4, name: 'Jake Taylor', score: '+1' },
        { place: 5, name: 'Nick Carpenter', score: '+2' },
        { place: 6, name: 'Richie Baker', score: '+5' },
        { place: 7, name: 'Joe Andulics', score: '+7' },
        { place: 8, name: 'Chuck Martin', score: '+11' },
        { place: 9, name: 'Jon Faro', score: '+13' },
        { place: 10, name: 'Sean Housel', score: '+13' },
        { place: 11, name: 'Chad Supers', score: '+18' },
        { place: 12, name: 'Kevin Fentner', score: 'DNF' },
      ]
    },
    {
      year: 2023,
      results: [
        { place: 1, name: 'Chad Supers', score: '+5' },
        { place: 2, name: 'Jimmy Stephens', score: '+6' },
        { place: 3, name: 'Chuck Martin', score: '+9' },
        { place: 4, name: 'Glen Morrison', score: '+10' },
        { place: 5, name: 'Jon Faro', score: '+11' },
        { place: 6, name: 'Nick Carpenter', score: '+12' },
        { place: 7, name: 'Sean Housel', score: '+13' },
        { place: 8, name: 'Jake Taylor', score: '+16' },
      ]
    },
    {
      year: 2022,
      results: [
        { place: 1, name: 'Chad Supers', score: '+4', note: 'Won putt-off' },
        { place: 2, name: 'Nick Carpenter', score: '+4' },
        { place: 3, name: 'Chuck Martin', score: '+5' },
        { place: 4, name: 'Glen Morrison', score: '+6' },
      ]
    },
  ],
  senecaOpens: [
    {
      year: 2025,
      format: 'Teams - Best Ball, Shamble & Alt Shot',
      results: [
        { place: 1, name: 'Joe Fitch & Jon Faro', score: '+3' },
        { place: 'T2', name: "Josh Houser & Ian O'Neil", score: '+4' },
        { place: 'T2', name: 'Sean Housel & Jared Fritz', score: '+4' },
        { place: 4, name: 'James Stephens & Jake Taylor', score: '+5' },
        { place: 5, name: 'Glen Morrison & Nick Carpenter', score: '+8' },
        { place: 6, name: 'Chuck Martin & Kevin Fentner', score: '+10' },
        { place: 7, name: 'Chad Supers & Joey Andulics', score: '+18' },
        { place: 8, name: 'Richie Baker & Tony Anderson', score: 'DNP' },
      ]
    },
    {
      year: 2024,
      format: 'Individual - 27 Holes',
      results: [
        { place: 1, name: 'Nick Carpenter', score: 'E' },
        { place: 2, name: 'Glen Morrison', score: '+2' },
        { place: 3, name: 'Jake Taylor', score: '+4' },
        { place: 4, name: 'Chad Supers', score: '+7' },
        { place: 5, name: 'Joe Fitch', score: '+7' },
        { place: 6, name: 'James Stephens', score: '+8' },
        { place: 7, name: 'Sean Housel', score: '+9' },
        { place: 8, name: 'Kevin Fentner', score: '+10' },
        { place: 9, name: 'Chuck Martin', score: '+14' },
        { place: 10, name: 'Joey Andulics', score: '+15' },
      ]
    },
  ],
};

// Player analytics data - now fetched from Google Sheets (see AnalyticsTab component)

// =============================================================================
// ICONS
// =============================================================================
const Icons = {
  leaderboard: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21V11M16 21V7M12 21V3" strokeLinecap="round"/>
    </svg>
  ),
  schedule: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  rules: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  history: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  analytics: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18"/>
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
    </svg>
  ),
};

// =============================================================================
// SPLASH SCREEN
// =============================================================================
const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: colors.green,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.5s ease-out',
    }}>
      {/* Sun/Star Logo */}
      <div style={{ animation: 'pulse 2s ease-in-out infinite' }}>
        <SunLogo size={120} />
      </div>

      {/* League Name */}
      <h1 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: 32,
        fontWeight: 700,
        color: colors.offWhite,
        marginTop: 24,
        letterSpacing: 2,
        textAlign: 'center',
        textTransform: 'uppercase',
      }}>
        AM Walking
      </h1>
      <h1 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: 32,
        fontWeight: 700,
        color: colors.offWhite,
        marginTop: -4,
        letterSpacing: 2,
        textAlign: 'center',
        textTransform: 'uppercase',
      }}>
        League
      </h1>
      <p style={{
        fontFamily: '"Source Sans 3", system-ui, sans-serif',
        fontSize: 13,
        color: colors.offWhiteMuted,
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginTop: 12,
      }}>Est. 2022</p>

      {/* Loading indicator */}
      <div style={{ marginTop: 48, display: 'flex', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: colors.yellow,
            animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }} />
        ))}
      </div>

      {/* Splash screen animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

// =============================================================================
// LEADERBOARD TAB
// =============================================================================
const LeaderboardTab = () => {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leagueStats, setLeagueStats] = useState(null);
  const [weekHeaders, setWeekHeaders] = useState(defaultWeekHeaders);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const groups = ['groupA', 'groupB', 'groupC', 'groupD'];
  const groupLabels = { groupA: 'Group A', groupB: 'Group B', groupC: 'Group C', groupD: 'Group D' };

  // Fetch leaderboard from Google Sheets on component mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(SHEETS_URLS.leaderboard);
        const csvText = await response.text();
        const { leaderboard, leagueStats: stats, weekHeaders: headers } = parseLeaderboardCSV(csvText);
        setLeaderboardData(leaderboard);
        setLeagueStats(stats);
        if (headers.length > 0) {
          // Format headers - replace "Major" with "S.O."
          const formattedHeaders = headers.map(h => h === 'Major' ? 'S.O.' : h);
          setWeekHeaders(formattedHeaders);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Unable to load leaderboard');
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.green,
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }} />
          ))}
        </div>
        <p style={{ color: colors.textMuted }}>Loading leaderboard...</p>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error || !leaderboardData) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p style={{ color: colors.textMuted }}>{error || 'Unable to load leaderboard'}</p>
      </div>
    );
  }

  // Calculate grid template based on number of weeks
  const numWeeks = weekHeaders.length;
  const gridTemplate = `28px 70px 50px repeat(${numWeeks}, 36px)`;
  const minTableWidth = 150 + (numWeeks * 36);

  return (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10,
        marginBottom: 20,
      }}>
        <div style={{
          background: colors.offWhite,
          borderRadius: 16,
          padding: 14,
          border: `2px solid ${colors.green}`,
        }}>
          <p style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Birdie Leader</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: colors.greenDark, fontFamily: '"Source Sans 3", system-ui' }}>{leagueStats?.birdieLeader?.name || '--'}</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>{leagueStats?.birdieLeader?.count || 0}</p>
        </div>
        <div style={{
          background: colors.offWhite,
          borderRadius: 16,
          padding: 14,
          border: `2px solid ${colors.green}`,
        }}>
          <p style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>League Birdies</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>{leagueStats?.totalBirdies || 0}</p>
          <p style={{ fontSize: 11, color: colors.green }}>This Season</p>
        </div>
        <div style={{
          background: colors.offWhite,
          borderRadius: 16,
          padding: 14,
          border: `2px solid ${colors.green}`,
        }}>
          <p style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Pot Total</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>${(leagueStats?.totalBirdies || 0) * 8}</p>
          <p style={{ fontSize: 11, color: colors.green }}>$0.50 Per Birdie</p>
        </div>
      </div>

      {/* Scrollable Leaderboard Table */}
      <div style={{
        background: colors.offWhite,
        borderRadius: 16,
        overflow: 'hidden',
        border: `2px solid ${colors.green}`,
        marginBottom: 20,
      }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: minTableWidth }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: gridTemplate,
              padding: '10px 8px',
              background: colors.green,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}>
              <div style={{ fontSize: 9, color: colors.offWhiteMuted, textTransform: 'uppercase' }}>#</div>
              <div style={{ fontSize: 9, color: colors.offWhiteMuted, textTransform: 'uppercase' }}>Player</div>
              <div style={{ fontSize: 9, color: colors.offWhiteMuted, textTransform: 'uppercase', textAlign: 'center' }}>Tot</div>
              {weekHeaders.map((w, i) => (
                <div key={i} style={{
                  fontSize: 9,
                  color: w === 'S.O.' ? colors.yellow : colors.offWhiteMuted,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  fontWeight: w === 'S.O.' ? 700 : 400,
                }}>{w}</div>
              ))}
            </div>

            {/* Groups */}
            {groups.map(groupKey => (
              <React.Fragment key={groupKey}>
                <div style={{
                  padding: '8px 12px',
                  background: colors.offWhiteMuted,
                  borderTop: `1px solid ${colors.green}20`,
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.green,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>{groupLabels[groupKey]}</span>
                </div>
                {(leaderboardData[groupKey] || []).map((player, idx) => (
                  <div key={player.name} style={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplate,
                    padding: '8px 8px',
                    borderBottom: `1px solid ${colors.offWhiteMuted}`,
                    background: idx % 2 === 0 ? 'white' : colors.offWhite,
                    alignItems: 'center',
                  }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: idx === 0 ? colors.yellow : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : colors.offWhiteMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: colors.greenDark,
                    }}>{player.rank}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.greenDark }}>{player.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.green, textAlign: 'center' }}>{player.total}</div>
                    {player.weeks.map((pts, i) => (
                      <div key={i} style={{
                        fontSize: 11,
                        textAlign: 'center',
                        color: pts >= 4 ? colors.green : pts === 0 ? colors.offWhiteMuted : colors.textDark,
                        fontWeight: pts >= 4 ? 700 : 400,
                      }}>{pts}</div>
                    ))}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', padding: '8px' }}>
          Swipe to see weekly points
        </p>
      </div>

      {/* Weekly Low Winners */}
      {leagueStats?.weeklyLowWinners?.length > 0 && (
        <>
          <h3 style={{
            fontFamily: '"Playfair Display", Georgia',
            fontSize: 18,
            color: colors.greenDark,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            Weekly Low Net Winners
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}>
            {leagueStats.weeklyLowWinners.map((winner, idx) => (
              <div key={`winner-${idx}`} style={{
                background: colors.offWhite,
                borderRadius: 12,
                padding: 12,
                border: `1px solid ${colors.offWhiteMuted}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: colors.yellow, fontWeight: 600 }}>Week {winner.week}</p>
                  <p style={{ fontSize: 11, color: colors.green, fontWeight: 700 }}>{winner.payout}</p>
                </div>
                <p style={{ fontWeight: 600, color: colors.greenDark, fontSize: 14, fontFamily: '"Source Sans 3", system-ui' }}>{winner.name}</p>
                {winner.score !== '--' && <p style={{ fontSize: 12, color: colors.textMuted }}>Net {winner.score}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// =============================================================================
// SCHEDULE TAB
// =============================================================================
const ScheduleTab = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch schedule from Google Sheets on component mount
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(SHEETS_URLS.schedule);
        const csvText = await response.text();
        const parsedSchedule = parseScheduleCSV(csvText);
        setScheduleData(parsedSchedule);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Unable to load schedule');
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const upcomingGames = scheduleData.filter(g => g.status === 'upcoming' && !g.isSpecialEvent);
  const completedGames = scheduleData.filter(g => g.status === 'completed' && !g.isSpecialEvent);
  const specialEvents = scheduleData.filter(g => g.isSpecialEvent);

  // Filter upcoming games based on selection
  const filteredUpcoming = selectedWeek === 'all'
    ? upcomingGames.slice(1)
    : upcomingGames.filter(g => g.week === selectedWeek);

  const formatDateLong = (dateStr) => {
    const [month, day] = dateStr.split(' ');
    const monthNames = {
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    };
    const suffix = day === '1' || day === '21' || day === '31' ? 'st'
      : day === '2' || day === '22' ? 'nd'
      : day === '3' || day === '23' ? 'rd' : 'th';
    return `${monthNames[month]} ${day}${suffix}`;
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.green,
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }} />
          ))}
        </div>
        <p style={{ color: colors.textMuted }}>Loading schedule...</p>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p style={{ color: colors.textMuted }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Next Round Highlight */}
      {upcomingGames.length > 0 && (
        <div style={{
          background: colors.yellow,
          borderRadius: 20,
          padding: 20,
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: -20,
            right: -20,
            fontSize: 80,
            opacity: 0.2,
          }}>&#9971;</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p style={{
                fontSize: 11,
                color: colors.greenDark,
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontWeight: 600,
                marginBottom: 4,
              }}>Next Round</p>
              <p style={{ fontSize: 14, color: colors.green, fontWeight: 500 }}>
                {formatDateLong(upcomingGames[0]?.date)}
              </p>
            </div>
            <div style={{
              background: colors.green,
              color: colors.offWhite,
              padding: '6px 12px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 600,
            }}>
              Week {upcomingGames[0]?.week}
            </div>
          </div>

          {/* Course 1 */}
          {upcomingGames[0]?.course1 && (
            <div style={{
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 12,
              padding: 12,
              marginBottom: upcomingGames[0]?.course2 ? 8 : 0,
            }}>
              <p style={{
                fontFamily: '"Playfair Display", Georgia',
                fontSize: 18,
                color: colors.greenDark,
                fontWeight: 600,
              }}>{upcomingGames[0]?.course1.name}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {upcomingGames[0]?.course1.groups.map(g => (
                  <span key={g} style={{
                    background: colors.green,
                    color: colors.offWhite,
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    Group {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Course 2 */}
          {upcomingGames[0]?.course2 && (
            <div style={{
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 12,
              padding: 12,
            }}>
              <p style={{
                fontFamily: '"Playfair Display", Georgia',
                fontSize: 18,
                color: colors.greenDark,
                fontWeight: 600,
              }}>{upcomingGames[0]?.course2.name}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {upcomingGames[0]?.course2.groups.map(g => (
                  <span key={g} style={{
                    background: colors.green,
                    color: colors.offWhite,
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    Group {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Rounds */}
      {upcomingGames.length > 1 && (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <h3 style={{
              fontFamily: '"Playfair Display", Georgia',
              fontSize: 16,
              color: colors.greenDark,
            }}>Upcoming Rounds</h3>

            {/* Filter Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: colors.offWhite,
                  border: `1px solid ${colors.green}`,
                  borderRadius: 10,
                  color: colors.greenDark,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: '"Source Sans 3", system-ui',
                }}
              >
                {selectedWeek === 'all' ? 'All Weeks' : `Week ${selectedWeek}`}
                <span style={{
                  transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease',
                  fontSize: 10,
                }}>&#9660;</span>
              </button>

              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: colors.offWhite,
                  border: `1px solid ${colors.green}`,
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: 180,
                  maxHeight: 250,
                  overflowY: 'auto',
                }}>
                  <button
                    onClick={() => { setSelectedWeek('all'); setShowDropdown(false); }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: selectedWeek === 'all' ? colors.green : 'transparent',
                      color: selectedWeek === 'all' ? colors.offWhite : colors.greenDark,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: '"Source Sans 3", system-ui',
                    }}
                  >
                    All Weeks
                  </button>
                  {upcomingGames.slice(1).map((game, idx) => (
                    <button
                      key={`filter-${game.week}-${idx}`}
                      onClick={() => { setSelectedWeek(game.week); setShowDropdown(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        borderTop: `1px solid ${colors.offWhiteMuted}`,
                        background: selectedWeek === game.week ? colors.green : 'transparent',
                        color: selectedWeek === game.week ? colors.offWhite : colors.greenDark,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: '"Source Sans 3", system-ui',
                      }}
                    >
                      Week {game.week} - {game.date}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {filteredUpcoming.map((game, index) => (
            <div key={`${game.week}-${index}`} style={{
              background: colors.offWhite,
              borderRadius: 14,
              marginBottom: 12,
              border: `1px solid ${colors.offWhiteMuted}`,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                borderBottom: `1px solid ${colors.offWhiteMuted}`,
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: colors.green,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <span style={{ fontSize: 10, color: colors.yellow }}>WK</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: colors.offWhite, fontFamily: '"Playfair Display", Georgia' }}>{game.week}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: colors.greenDark, fontSize: 14, fontFamily: '"Source Sans 3", system-ui' }}>{formatDateLong(game.date)}</p>
                </div>
              </div>
              <div style={{ padding: '10px 14px 14px' }}>
                {game.course1 && (
                  <div style={{ marginBottom: game.course2 ? 10 : 0 }}>
                    <p style={{ fontWeight: 700, color: colors.greenDark, fontSize: 15 }}>{game.course1.name}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {game.course1.groups.map(g => (
                        <span key={g} style={{
                          background: colors.green,
                          color: colors.offWhite,
                          padding: '3px 10px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 600,
                        }}>Group {g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {game.course2 && (
                  <div>
                    <p style={{ fontWeight: 700, color: colors.greenDark, fontSize: 15 }}>{game.course2.name}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {game.course2.groups.map(g => (
                        <span key={g} style={{
                          background: colors.green,
                          color: colors.offWhite,
                          padding: '3px 10px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 600,
                        }}>Group {g}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Completed */}
      {completedGames.length > 0 && (
        <>
          <h3 style={{
            fontFamily: '"Playfair Display", Georgia',
            fontSize: 16,
            color: colors.greenDark,
            marginTop: 24,
            marginBottom: 12,
          }}>Completed</h3>
          {completedGames.map((game, index) => (
            <div key={`completed-${game.week}-${index}`} style={{
              background: colors.offWhiteMuted,
              borderRadius: 12,
              marginBottom: 10,
              overflow: 'hidden',
              opacity: 0.85,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderBottom: `1px solid ${colors.offWhite}`,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: colors.green,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  color: colors.offWhite,
                  fontSize: 14,
                }}>&#10003;</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500, color: colors.textMuted, fontSize: 13 }}>Week {game.week} - {game.date}</p>
                </div>
              </div>
              <div style={{ padding: '8px 12px 12px' }}>
                {game.course1 && (
                  <div style={{ marginBottom: game.course2 ? 8 : 0 }}>
                    <p style={{ fontWeight: 600, color: colors.textMuted, fontSize: 13 }}>{game.course1.name}</p>
                    <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                      {game.course1.groups.map(g => (
                        <span key={g} style={{
                          background: colors.textMuted,
                          color: colors.offWhite,
                          padding: '2px 8px',
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 600,
                        }}>Group {g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {game.course2 && (
                  <div>
                    <p style={{ fontWeight: 600, color: colors.textMuted, fontSize: 13 }}>{game.course2.name}</p>
                    <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                      {game.course2.groups.map(g => (
                        <span key={g} style={{
                          background: colors.textMuted,
                          color: colors.offWhite,
                          padding: '2px 8px',
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 600,
                        }}>Group {g}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// =============================================================================
// RULES TAB
// =============================================================================
const RulesTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const filteredRules = rulesData.filter(rule => {
    const allText = [rule.title, rule.category, ...(rule.bullets || []), ...(rule.subBullets || [])].join(' ').toLowerCase();
    const matchesSearch = allText.includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || rule.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(rulesData.map(r => r.category))];

  const getCategoryIcon = (category) => {
    return category === 'League Overview' ? '📋' : '⛳';
  };

  return (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: 20,
      }}>
        <input
          type="text"
          placeholder="Search rules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px 14px 44px',
            borderRadius: 14,
            border: `2px solid ${colors.green}`,
            background: colors.offWhite,
            color: colors.greenDark,
            fontSize: 15,
            outline: 'none',
            fontFamily: '"Source Sans 3", system-ui',
            boxSizing: 'border-box',
          }}
        />
        <span style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: colors.textMuted,
          fontSize: 18,
        }}>&#128269;</span>
      </div>

      {/* Category Buttons */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 20,
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: `1px solid ${activeCategory === cat ? colors.green : colors.offWhiteMuted}`,
              background: activeCategory === cat ? colors.green : colors.offWhite,
              color: activeCategory === cat ? colors.offWhite : colors.greenDark,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: '"Source Sans 3", system-ui',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: activeCategory === cat ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <span>{getCategoryIcon(cat)}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Rules Count */}
      <p style={{
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 12,
        fontWeight: 500,
      }}>
        Showing {filteredRules.length} rule{filteredRules.length !== 1 ? 's' : ''}
        {activeCategory && ` in ${activeCategory}`}
      </p>

      {/* Rules List */}
      {filteredRules.map(rule => (
        <div
          key={rule.id}
          style={{
            background: colors.offWhite,
            borderRadius: 14,
            marginBottom: 12,
            border: `1px solid ${colors.offWhiteMuted}`,
            padding: 16,
            borderLeft: `4px solid ${rule.category === 'League Overview' ? colors.yellow : colors.green}`,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 10,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: rule.category === 'League Overview' ? colors.yellow : colors.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}>{getCategoryIcon(rule.category)}</div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontWeight: 700,
                color: colors.greenDark,
                fontSize: 16,
                fontFamily: '"Source Sans 3", system-ui',
                marginBottom: 2,
              }}>{rule.title}</p>
              <p style={{
                fontSize: 11,
                color: rule.category === 'League Overview' ? colors.yellow : colors.green,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>{rule.category}</p>
            </div>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <ul style={{
              margin: 0,
              paddingLeft: 18,
              listStyleType: 'disc',
            }}>
              {(rule.bullets || []).map((bullet, i) => (
                <li key={i} style={{
                  color: colors.textDark,
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 6,
                }}>{bullet}</li>
              ))}
            </ul>
            {rule.subBullets && (
              <ul style={{
                margin: '4px 0 0 0',
                paddingLeft: 36,
                listStyleType: 'circle',
              }}>
                {rule.subBullets.map((sub, i) => (
                  <li key={i} style={{
                    color: colors.textMuted,
                    fontSize: 13,
                    lineHeight: 1.5,
                    marginBottom: 4,
                  }}>{sub}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}

      {filteredRules.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: colors.textMuted,
        }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>&#128269;</p>
          <p>No rules found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// HISTORY TAB
// =============================================================================
// Map championship years to photo paths
const champPhotos = {
  2022: '/championship2022.jpg',
  2023: '/championship2023.jpg',
  2024: '/championship2024.jpg',
  2025: '/championship2025.jpeg',
};
const champPhotoPositions = {
  2022: '20%',
  2023: '30%',
  2024: '20%',
  2025: '25%',
};
const senecaPhotos = {
  2025: '/seneca2025.jpeg',
};
const senecaPhotoPositions = {
  2025: '30%',
};

const HistoryTab = () => {
  const [expandedYear, setExpandedYear] = useState(null);
  const [expandedSeneca, setExpandedSeneca] = useState(null);
  const [showCurrentChampResults, setShowCurrentChampResults] = useState(false);

  const currentChamp = historicalData.championships[0];
  const pastChamps = historicalData.championships.slice(1);

  return (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Current Champion Banner */}
      <div style={{
        background: colors.yellow,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        position: 'relative',
      }}>
        {/* Championship Photo */}
        {champPhotos[currentChamp.year] && (
          <img
            src={champPhotos[currentChamp.year]}
            objectPosition={champPhotoPositions[currentChamp.year] || '25%'}
            alt={`${currentChamp.year} Champions`}
            style={{
              width: '100%',
              height: 220,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        <div style={{ padding: 24, textAlign: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 50%)',
        }} />
        <span style={{ fontSize: 48 }}>&#127942;</span>
        <p style={{
          fontSize: 11,
          color: colors.greenDark,
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginTop: 12,
        }}>{currentChamp.year} Champion</p>
        <h2 style={{
          fontFamily: '"Playfair Display", Georgia',
          fontSize: 28,
          color: colors.greenDark,
          marginTop: 4,
        }}>{currentChamp.results[0].name}</h2>
        <p style={{ fontSize: 15, color: colors.green, marginTop: 4, fontWeight: 600 }}>
          {currentChamp.results[0].score}
        </p>

        {/* Top 3 Podium */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          marginTop: 16,
        }}>
          {currentChamp.results.slice(1, 3).map((player, idx) => (
            <div key={player.name} style={{
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 10,
              padding: '8px 14px',
            }}>
              <p style={{ fontSize: 11, color: colors.textMuted }}>{idx === 0 ? '2nd' : '3rd'}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: colors.greenDark }}>{player.name}</p>
              <p style={{ fontSize: 12, color: colors.green }}>{player.score}</p>
            </div>
          ))}
        </div>

        {/* View Full Results */}
        <button
          type="button"
          onClick={() => setShowCurrentChampResults(!showCurrentChampResults)}
          style={{
            marginTop: 16,
            background: colors.green,
            color: colors.offWhite,
            border: 'none',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {showCurrentChampResults ? 'Hide Results' : 'View Full Results'}
        </button>

        {showCurrentChampResults && (
          <div style={{
            marginTop: 16,
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 12,
            padding: 12,
            textAlign: 'left',
          }}>
            {currentChamp.results.map((player, idx) => (
              <div key={player.name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: idx < currentChamp.results.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: idx === 0 ? colors.yellow : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : colors.offWhiteMuted,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.greenDark,
                    border: idx === 0 ? `2px solid ${colors.greenDark}` : 'none',
                  }}>{player.place}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: colors.greenDark }}>{player.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.green }}>{player.score}</span>
              </div>
            ))}
          </div>
        )}
        </div>{/* end padding div */}
      </div>

      {/* Past Champions */}
      <h3 style={{
        fontFamily: '"Playfair Display", Georgia',
        fontSize: 18,
        color: colors.greenDark,
        marginBottom: 14,
      }}>Hall of Champions</h3>
      {pastChamps.map((champ) => (
        <div key={champ.year} style={{
          background: colors.offWhite,
          borderRadius: 14,
          marginBottom: 12,
          border: expandedYear === champ.year ? `2px solid ${colors.green}` : `1px solid ${colors.offWhiteMuted}`,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div
            onClick={() => setExpandedYear(expandedYear === champ.year ? null : champ.year)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 16,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              background: colors.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <span style={{
                fontFamily: '"Playfair Display", Georgia',
                fontSize: 16,
                fontWeight: 700,
                color: colors.yellow,
              }}>{champ.year}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: colors.greenDark, fontSize: 17, marginBottom: 2, fontFamily: '"Source Sans 3", system-ui' }}>
                {champ.results[0].name}
              </p>
              <p style={{ fontSize: 12, color: colors.textMuted }}>
                {champ.results[0].score} {champ.results[0].note && `- ${champ.results[0].note}`}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>&#127942;</span>
              <span style={{
                color: colors.textMuted,
                transform: expandedYear === champ.year ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
              }}>&#9660;</span>
            </div>
          </div>

          {/* Expanded Results */}
          {expandedYear === champ.year && (
            <div style={{
              borderTop: `1px solid ${colors.offWhiteMuted}`,
            }}>
              {champPhotos[champ.year] && (
                <img
                  src={champPhotos[champ.year]}
                  objectPosition={champPhotoPositions[champ.year] || '25%'}
                  alt={`${champ.year} Champions`}
                  style={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              )}
              <div style={{ padding: '0 16px 16px' }}>
              <p style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px', fontWeight: 600 }}>Full Results</p>
              {champ.results.map((player, idx) => (
                <div key={player.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: idx < champ.results.length - 1 ? `1px solid ${colors.offWhiteMuted}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: idx === 0 ? colors.yellow : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : colors.offWhiteMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: colors.greenDark,
                    }}>{player.place}</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: colors.greenDark }}>{player.name}</span>
                      {player.note && <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 6 }}>({player.note})</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.green }}>{player.score}</span>
                </div>
              ))}
              </div>{/* end inner padding div */}
            </div>
          )}
        </div>
      ))}

      {/* Seneca Open */}
      <h3 style={{
        fontFamily: '"Playfair Display", Georgia',
        fontSize: 18,
        color: colors.greenDark,
        marginTop: 28,
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span>&#9971;</span> Seneca Open
      </h3>
      {historicalData.senecaOpens.map((seneca) => (
        <div key={seneca.year} style={{
          background: colors.offWhite,
          borderRadius: 14,
          marginBottom: 12,
          border: expandedSeneca === seneca.year ? `2px solid ${colors.green}` : `1px solid ${colors.offWhiteMuted}`,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div
            onClick={() => setExpandedSeneca(expandedSeneca === seneca.year ? null : seneca.year)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 16,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              background: colors.yellow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <span style={{
                fontFamily: '"Playfair Display", Georgia',
                fontSize: 16,
                fontWeight: 700,
                color: colors.greenDark,
              }}>{seneca.year}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: colors.greenDark, fontSize: 16, marginBottom: 2, fontFamily: '"Source Sans 3", system-ui' }}>
                {seneca.results[0].name}
              </p>
              <p style={{ fontSize: 11, color: colors.textMuted }}>{seneca.format}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: colors.green,
                color: colors.offWhite,
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600
              }}>{seneca.results[0].score}</span>
              <span style={{
                color: colors.textMuted,
                transform: expandedSeneca === seneca.year ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
              }}>&#9660;</span>
            </div>
          </div>

          {/* Expanded Results */}
          {expandedSeneca === seneca.year && (
            <div style={{
              borderTop: `1px solid ${colors.offWhiteMuted}`,
            }}>
              {senecaPhotos[seneca.year] && (
                <img
                  src={senecaPhotos[seneca.year]}
                  objectPosition={senecaPhotoPositions[seneca.year] || '30%'}
                  alt={`${seneca.year} Seneca Open`}
                  style={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              )}
              <div style={{ padding: '0 16px 16px' }}>
              <p style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 8px', fontWeight: 600 }}>Full Results</p>
              {seneca.results.map((player, idx) => (
                <div key={player.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: idx < seneca.results.length - 1 ? `1px solid ${colors.offWhiteMuted}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: idx === 0 ? colors.yellow : colors.offWhiteMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: colors.greenDark,
                    }}>{player.place}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: colors.greenDark }}>{player.name}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: player.score === 'E' ? colors.green : colors.greenDark }}>{player.score}</span>
                </div>
              ))}
              </div>{/* end inner padding div */}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// ANALYTICS TAB
// =============================================================================
const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [lowestNetRecord, setLowestNetRecord] = useState(null);
  const [lowestGrossRecord, setLowestGrossRecord] = useState(null);
  const [mostBirdiesRecord, setMostBirdiesRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('avgNet');
  const [sortDir, setSortDir] = useState('asc');

  // Fetch stats from Google Sheets on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(SHEETS_URLS.stats);
        const csvText = await response.text();
        const parsedStats = parseStatsCSV(csvText);
        setAnalyticsData(parsedStats.players);
        setLowestNetRecord(parsedStats.lowestNetRecord);
        setLowestGrossRecord(parsedStats.lowestGrossRecord);
        setMostBirdiesRecord(parsedStats.mostBirdiesRecord);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Unable to load stats');
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const sortedData = [...analyticsData].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (typeof valA === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir(field === 'birdies' || field === 'avgPts' ? 'desc' : 'asc');
    }
  };

  const columns = [
    { key: 'avgNet', label: 'Net', shortLabel: 'Net' },
    { key: 'avgGross', label: 'Gross', shortLabel: 'Grs' },
    { key: 'avgHdcp', label: 'Hdcp', shortLabel: 'Hcp' },
    { key: 'birdies', label: 'Birdies', shortLabel: 'Brd' },
    { key: 'missedWeeks', label: 'Missed', shortLabel: 'Miss' },
  ];

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.green,
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }} />
          ))}
        </div>
        <p style={{ color: colors.textMuted }}>Loading stats...</p>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error || analyticsData.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p style={{ color: colors.textMuted }}>{error || 'No stats available'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        <div style={{
          background: colors.green,
          borderRadius: 12,
          padding: 12,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: colors.offWhiteMuted, textTransform: 'uppercase' }}>Most Birdies</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>{mostBirdiesRecord?.player || '--'}</p>
          <p style={{ fontSize: 11, color: colors.offWhiteMuted }}>({mostBirdiesRecord?.score || '--'})</p>
        </div>
        <div style={{
          background: colors.green,
          borderRadius: 12,
          padding: 12,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: colors.offWhiteMuted, textTransform: 'uppercase' }}>Lowest Net</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>{lowestNetRecord?.player || '--'}</p>
          <p style={{ fontSize: 11, color: colors.offWhiteMuted }}>({lowestNetRecord?.score || '--'})</p>
        </div>
        <div style={{
          background: colors.green,
          borderRadius: 12,
          padding: 12,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: colors.offWhiteMuted, textTransform: 'uppercase' }}>Lowest Gross</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: colors.yellow, fontFamily: '"Playfair Display", Georgia' }}>{lowestGrossRecord?.player || '--'}</p>
          <p style={{ fontSize: 11, color: colors.offWhiteMuted }}>({lowestGrossRecord?.score || '--'})</p>
        </div>
      </div>

      {/* Stat Selection Pills */}
      <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Sort By:</p>
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4,
        WebkitOverflowScrolling: 'touch',
      }}>
        {[
          { key: 'avgNet', label: 'Avg Net' },
          { key: 'avgGross', label: 'Avg Gross' },
          { key: 'avgPts', label: 'Avg Pts' },
          { key: 'birdies', label: 'Birdies' },
          { key: 'avgHdcp', label: 'Handicap' },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => handleSort(stat.key)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: 'none',
              background: sortBy === stat.key ? colors.green : colors.offWhiteMuted,
              color: sortBy === stat.key ? colors.offWhite : colors.textMuted,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {stat.label}
            {sortBy === stat.key && (
              <span style={{ fontSize: 9 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div style={{
        background: colors.offWhite,
        borderRadius: 16,
        overflow: 'hidden',
        border: `2px solid ${colors.green}`,
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 0.6fr 0.6fr',
          padding: '10px 10px',
          background: colors.green,
          borderBottom: `1px solid ${colors.greenDark}`,
          gap: 4,
        }}>
          <div
            onClick={() => handleSort('player')}
            style={{
              fontSize: 10,
              color: sortBy === 'player' ? colors.yellow : colors.offWhiteMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              cursor: 'pointer',
              fontWeight: sortBy === 'player' ? 700 : 500,
            }}
          >
            Player
          </div>
          {columns.map(col => (
            <div
              key={col.key}
              onClick={() => handleSort(col.key)}
              style={{
                fontSize: 10,
                color: sortBy === col.key ? colors.yellow : colors.offWhiteMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                textAlign: 'center',
                cursor: 'pointer',
                fontWeight: sortBy === col.key ? 700 : 500,
              }}
            >
              {col.shortLabel}
            </div>
          ))}
        </div>

        {/* Table Rows */}
        {sortedData.map((player, idx) => (
          <div
            key={player.player}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 0.6fr 0.6fr',
              padding: '10px 10px',
              borderBottom: idx < sortedData.length - 1 ? `1px solid ${colors.offWhiteMuted}` : 'none',
              background: idx % 2 === 0 ? 'transparent' : colors.offWhiteMuted,
              gap: 4,
              alignItems: 'center',
            }}
          >
            <div style={{
              fontSize: 13,
              color: colors.greenDark,
              fontWeight: 600,
              fontFamily: '"Source Sans 3", system-ui',
            }}>
              {player.player}
            </div>
            <div style={{
              fontSize: 13,
              color: sortBy === 'avgNet' ? colors.green : colors.greenDark,
              fontWeight: sortBy === 'avgNet' ? 700 : 500,
              textAlign: 'center',
            }}>
              {player.avgNet}
            </div>
            <div style={{
              fontSize: 13,
              color: sortBy === 'avgGross' ? colors.green : colors.textMuted,
              fontWeight: sortBy === 'avgGross' ? 700 : 500,
              textAlign: 'center',
            }}>
              {player.avgGross}
            </div>
            <div style={{
              fontSize: 13,
              color: sortBy === 'avgHdcp' ? colors.green : colors.textMuted,
              fontWeight: sortBy === 'avgHdcp' ? 700 : 500,
              textAlign: 'center',
            }}>
              {player.avgHdcp}
            </div>
            <div style={{
              fontSize: 13,
              color: sortBy === 'birdies' ? colors.green : colors.greenDark,
              fontWeight: sortBy === 'birdies' ? 700 : 500,
              textAlign: 'center',
            }}>
              {player.birdies}
            </div>
            <div style={{
              fontSize: 13,
              color: sortBy === 'missedWeeks' ? colors.green : (player.missedWeeks > 0 ? colors.textMuted : colors.offWhiteMuted),
              fontWeight: sortBy === 'missedWeeks' ? 700 : 500,
              textAlign: 'center',
            }}>
              {player.missedWeeks}
            </div>
          </div>
        ))}
      </div>

      <p style={{
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: 16,
      }}>
        Tap pills or column headers to sort
      </p>
    </div>
  );
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================
export default function GolfLeagueApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');

  const tabs = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Icons.leaderboard },
    { id: 'schedule', label: 'Schedule', icon: Icons.schedule },
    { id: 'rules', label: 'Rules', icon: Icons.rules },
    { id: 'history', label: 'History', icon: Icons.history },
    { id: 'analytics', label: 'Stats', icon: Icons.analytics },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'leaderboard': return <LeaderboardTab />;
      case 'schedule': return <ScheduleTab />;
      case 'rules': return <RulesTab />;
      case 'history': return <HistoryTab />;
      case 'analytics': return <AnalyticsTab />;
      default: return <LeaderboardTab />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'leaderboard': return 'Leaderboard';
      case 'schedule': return 'Schedule';
      case 'rules': return 'League Rules';
      case 'history': return 'Hall of Fame';
      case 'analytics': return 'Player Stats';
      default: return 'AWL';
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.offWhite,
      fontFamily: '"Source Sans 3", system-ui, sans-serif',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        paddingTop: 'calc(env(safe-area-inset-top, 20px) + 12px)',
        paddingBottom: 20,
        paddingLeft: 20,
        paddingRight: 20,
        background: colors.green,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 26,
            fontWeight: 700,
            color: colors.offWhite,
            margin: 0,
          }}>{getTitle()}</h1>
          <p style={{
            fontSize: 12,
            color: colors.yellow,
            marginTop: 2,
            letterSpacing: 1,
            fontWeight: 600,
          }}>AM WALKING LEAGUE</p>
        </div>
        {/* AWL Sun Logo */}
        <SunLogo size={40} />
      </div>

      {/* Content */}
      <div style={{ paddingTop: 20 }}>
        {renderTab()}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: colors.green,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: '8px 0 24px',
        display: 'flex',
        justifyContent: 'space-around',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 0',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              color: activeTab === tab.id ? colors.yellow : colors.offWhiteMuted,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              transform: activeTab === tab.id ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}>
              {tab.icon}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: activeTab === tab.id ? 600 : 400,
              letterSpacing: 0.5,
            }}>{tab.label}</span>
            {activeTab === tab.id && (
              <div style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: colors.yellow,
                marginTop: -2,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        input::placeholder {
          color: ${colors.textMuted};
        }

        ::-webkit-scrollbar {
          display: none;
        }

        html, body {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}
