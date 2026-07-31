# ⚡ IdeaEngine — YouTube Video Idea Generator

A clean, dark-themed tool that surfaces breakout video ideas from **small creators** — not celebrity noise.

Enter a topic, filter by channel size and recency, and get:
- **Keyword insights** — search volume, competition, overall score
- **6 scored title ideas** — based on real breakout patterns, with context explaining *why* each pattern works
- **Top 5 videos to study** — with outlier score, VPH (views/hr), and engagement stats so you can compare editing style and packaging

![IdeaEngine Screenshot](https://img.shields.io/badge/status-prototype-7C5CFC?style=flat-square)

## How It Works

| Signal | What It Measures |
|---|---|
| **Outlier Score** | Views relative to the channel's own average — ⚫ <2x, 🔵 2-5x, 🟣 5-10x, 🔴 10x+ |
| **VPH** | Views per hour — is the video still accelerating (↑ green) or cooling off (↓ red)? |
| **Search Volume** | Estimated monthly YouTube searches for the keyword |
| **Competition** | How many strong videos already rank for this term |
| **Overall Score** | Volume + competition blend — high volume + low competition = high score |

## Filters

- **Channel Size Cap** — Under 100K / 500K / 1M subs (keeps results achievable)
- **Time Window** — 30 / 90 / 180 days
- **VPH Direction** — Rising only vs All

## Tech Stack

Zero dependencies. Pure HTML + CSS + JavaScript.

- `index.html` — structure
- `styles.css` — design system (dark theme, color-coded signals)
- `app.js` — logic + mock data generator

## Color System

Every color carries meaning, not decoration:

| Color | Meaning |
|---|---|
| Violet `#7C5CFC` | Primary action, title scores |
| Gray → Blue → Purple → Red | Outlier score magnitude ramp |
| Green / Red | VPH direction (rising / cooling) |
| Green / Amber / Red | Keyword quality (good / caution / bad) |

All badges pair color with a number so it works for colorblind users.

## Running Locally

Just open `index.html` in any browser. No server, no build step.

## Next Steps

The `generateMockData()` function in `app.js` is where you'd plug in real API calls (YouTube Data API, vidIQ, etc.) to replace the mock data with live results.

## License

MIT
