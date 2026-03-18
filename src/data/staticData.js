export const rulesData = [
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
    'Alt Shot (adjusted team handicap)',
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
    'The Kevin Rule: no gimmies for birdies, pars or bogeys for Championship Weekend only.',
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
export const historicalData = {
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

