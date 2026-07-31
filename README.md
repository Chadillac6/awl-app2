# AM Walking League (AWL)

A mobile-first web app for the AM Walking League, a 14-week summer golf league. Tracks leaderboards, schedules, player stats, league rules, and championship history.

## Features

- **Leaderboard** -- Live standings across four groups with weekly point breakdowns, birdie tracking, and weekly low net winners
- **Schedule** -- Upcoming and completed rounds with course assignments per group
- **Player Stats** -- Sortable averages for net, gross, handicap, birdies, and missed weeks
- **Rules** -- Searchable and filterable league rules reference
- **Hall of Fame** -- Historical championship and Seneca Open results with photos

## Data Source

Live data is read through Netlify Functions from the AWL Google Sheet using service-account authentication, with published CSV fallback and offline caching in the browser.

## Tech Stack

- **React 19** with Vite 7
- No routing library -- tab-based SPA with a bottom navigation bar
- No component library -- custom UI with inline styles
- Google Fonts: Playfair Display, Source Sans 3

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit and integration tests |
| `npm run test:e2e` | Run Playwright browser regressions |
| `npm run check` | Run the complete local quality gate |

## Delivery Workflow

Production changes use feature branches, pull requests, GitHub Actions quality gates, and Netlify deploy previews. See [docs/SDLC.md](docs/SDLC.md) for the complete process.
