export const championshipFallback = {
  events: [
    { name: 'Round One', date: '8/8/2026', time: '6:00 AM', venue: 'Shawnee Hills', address: '', details: '' },
    { name: 'Final Round', date: '8/9/2026', time: '6:00 AM', venue: 'Shale Creek', address: '', details: '' },
    { name: 'AWL Awards Ceremony', date: '8/9/2026', time: '1:30 PM', venue: 'Awards Ceremony', address: '13489 Lake Avenue, Lakewood, Ohio', details: '' },
  ],
  rules: [
    { number: '1', name: 'The Kevin Rule', text: 'No gimmies for birdies, pars, or bogeys during Championship Weekend.' },
    { number: '2', name: 'Out of Bounds', text: 'Played as a red stake. Drop within two club lengths.' },
    { number: '3', name: 'Championship Tie', text: 'Final approved championship tiebreak procedure will appear here.' },
  ],
  groups: [
    { name: 'Group 1', teeTime: '', players: ['Chuck', 'Sean', 'Fitch', 'Ian'], notes: '' },
    { name: 'Group 2', teeTime: '', players: ['Jimmy', 'Andulics', 'Tony', 'Glen'], notes: '' },
    { name: 'Group 3', teeTime: '', players: ['Baker', 'Houser', 'Chad', 'Faro'], notes: '' },
    { name: 'Group 4', teeTime: '', players: ['Jared', 'Carp', 'Jake', 'Basar'], notes: '' },
  ],
  leaderboard: [
    'Chuck', 'Sean', 'Fitch', 'Ian', 'Jimmy', 'Andulics', 'Tony', 'Glen',
    'Baker', 'Houser', 'Chad', 'Faro', 'Jared', 'Carp', 'Jake', 'Basar',
  ].map((name, index) => ({
    position: null,
    name,
    group: `Group ${Math.floor(index / 4) + 1}`,
    round1Net: null,
    round2Net: null,
    weekendNet: null,
    grossTotal: null,
    notes: '',
  })),
  controls: {
    'Groupings Confirmed?': 'YES',
    'Championship Mode Ready?': 'NO',
    Sponsor: 'Anderson Heating & Cooling',
  },
};

export const championshipPayouts = [
  { label: '1st Place', amount: '$900', detail: '2026 AWL Champion', featured: true },
  { label: '2nd Place', amount: '$300', detail: 'Runner-up' },
  { label: '3rd Place', amount: '$100', detail: 'Third place' },
  { label: 'Gross Winner', amount: '$100', detail: 'Lowest gross score' },
];
