# MLB Scorebug

A modern MLB scorebug with a built-in game simulator. No build tools required — just open `index.html` in a browser.

![Scorebug Preview](https://img.shields.io/badge/SEA_vs_TOR-Live_Sim-0B2C57)

## Features

### Scorebug
- Horizontal team cards with official MLB logos
- Current batter with lineup order and game AB stats
- Current pitcher with live pitch count
- Compact ball-strike count and out indicators
- Base runner diamond
- Inning display with top/bottom arrow
- Score flash animation on runs
- "Final" banner on game completion

### Simulator
- Pitch-by-pitch game simulation with weighted outcomes
- Realistic game logic: walks, strikeouts, hits, home runs, sacrifice flies, double plays, walk-offs, extra innings
- **Play/Pause** — auto-run the simulation
- **Next Pitch** — step through one pitch at a time
- **Speed** — adjustable from 1x to 10x
- **Reset** — restart with a fresh game
- Collapsible play-by-play log

### Theme
- Dark and light mode with toggle in the bottom-left corner
- Defaults to system preference
- Persists selection to `localStorage`

## Getting Started

```
open index.html
```

Or serve it locally:

```
npx serve .
```

## Structure

```
index.html      — Page markup and layout
styles.css      — Theming (dark/light), scorebug, and controls
simulator.js    — Game state, simulation engine, rendering, and controls
```

## Matchup

The default matchup is **Seattle Mariners @ Toronto Blue Jays** with full 9-player lineups and starting pitchers.

| Team | Starter |
|------|---------|
| SEA  | L. Gilbert |
| TOR  | K. Gausman |
