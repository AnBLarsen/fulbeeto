# FulBee.TO 🐝⚽

A World Cup 2026 companion app with live match data, group standings, a knockout bracket, and **BeeBot** — an AI assistant powered by Claude that can answer any question about the tournament in real time.

**[Live Demo →](https://fulbeeto.vercel.app/en)** &nbsp;|&nbsp; Built with Next.js, TypeScript, and the Anthropic API.

---

## What it does

- **Fixtures** — Browse today's matches or navigate by date. Refreshes every 60 seconds.
- **Standings** — Live group stage table for all 12 groups.
- **Bracket** — Knockout round tracker from the Round of 32 to the Final.
- **Team pages** — Stats and match history for any World Cup team.
- **BeeBot** — An AI chat assistant with live tool access to answer questions about scores, fixtures, standings, and predictions.
- **i18n** — Full English and Spanish support.

---

## The AI part: BeeBot

BeeBot is not a simple chatbot. It uses the Anthropic API with **tool use** (function calling), meaning Claude can decide on its own when to fetch live data and which tool to use before responding.

The agentic loop works like this:

```
User message
    ↓
Claude decides which tool(s) to call
    ↓
Server fetches live data from football-data.org
    ↓
Claude reasons over the result and responds
```

**Tools available to BeeBot:**

| Tool | What it does |
|------|-------------|
| `get_fixtures` | Fetch matches for a date or date range |
| `get_standings` | Get group stage standings, optionally filtered to one group |
| `get_team_matches` | All World Cup matches for a specific team |
| `get_match_result` | Full details and score for a specific match |

The server implements a `while (stop_reason === "tool_use")` loop so Claude can chain multiple tool calls if needed — for example, fetching standings first to find a team ID, then fetching that team's matches.

**Safety guardrails on the API route:**
- Rate limiting: 20 requests / IP / hour
- Max message length: 500 characters
- Max request body: ~32 KB
- Conversation history trimmed to the last 20 messages
- Language detection: BeeBot replies in whatever language you write in

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Anthropic API (`claude-haiku-4-5`) with tool use |
| Football data | [football-data.org](https://www.football-data.org) API v4 |
| i18n | next-intl |
| Deployment | Vercel |

---

## Running locally

**1. Clone and install**

```bash
git clone https://github.com/your-username/fulbeeto.git
cd fulbeeto
npm install
```

**2. Set up environment variables**

```bash
cp .env.local.example .env.local
```

Then fill in your keys:

```env
FOOTBALL_DATA_KEY=   # Free tier at football-data.org
ANTHROPIC_API_KEY=   # From console.anthropic.com
```

**3. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
├── app/
│   ├── [locale]/          # Localised pages (fixtures, standings, bracket, teams)
│   └── api/
│       ├── agent/         # BeeBot — agentic loop + rate limiting
│       ├── fixtures/      # Match schedule endpoint
│       ├── matches/       # Match detail endpoint
│       ├── standings/     # Group standings endpoint
│       └── teams/[id]/    # Team detail endpoint
├── components/            # UI components (ChatPanel, BracketView, StandingsTable…)
├── lib/
│   ├── agent-tools.ts     # Claude tool definitions + system prompt
│   ├── football-api.ts    # football-data.org API client
│   └── rate-limit.ts      # In-memory rate limiter
└── types/
    └── football.ts        # Shared TypeScript types
```

---

## Screenshots

>

---

## License

MIT
