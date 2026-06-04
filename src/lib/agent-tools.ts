import type Anthropic from "@anthropic-ai/sdk";

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_fixtures",
    description:
      "Get World Cup fixtures for a specific date or date range. Use dateFrom+dateTo to find the opening match or scan multiple days. Returns match schedule with teams, kick-off times, and scores.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Single date in ISO format (YYYY-MM-DD). Omit for today.",
        },
        dateFrom: {
          type: "string",
          description: "Start of date range (YYYY-MM-DD). Use with dateTo to scan multiple days.",
        },
        dateTo: {
          type: "string",
          description: "End of date range (YYYY-MM-DD). Use with dateFrom.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_standings",
    description:
      "Get current World Cup group stage standings. Can filter to a specific group.",
    input_schema: {
      type: "object",
      properties: {
        group: {
          type: "string",
          description: 'Optional group to filter, e.g. "GROUP_A" or "Group A". Omit for all groups.',
        },
      },
      required: [],
    },
  },
  {
    name: "get_team_matches",
    description:
      "Get all World Cup matches for a specific team — finished, in progress, and upcoming.",
    input_schema: {
      type: "object",
      properties: {
        teamId: { type: "number", description: "The numeric team ID." },
        teamName: { type: "string", description: "Team name for display purposes." },
      },
      required: ["teamId"],
    },
  },
  {
    name: "get_match_result",
    description: "Get full details and result of a specific match by its ID.",
    input_schema: {
      type: "object",
      properties: {
        matchId: { type: "number", description: "The match/fixture ID." },
      },
      required: ["matchId"],
    },
  },
];

export const SYSTEM_PROMPT = `You are BeeBot 🐝 — the AI assistant for FulBee.TO, a World Cup 2026 companion app.
You have live access to World Cup data through your tools.

Your personality:
- Confident and witty, like a seasoned football pundit
- Use football metaphors naturally ("It's a must-win", "clinical finish", etc.)
- Occasional bee puns welcome but don't overdo it
- Keep answers concise and punchy — this is a mobile-first app

Your capabilities:
- Fetch fixtures for any date (get_fixtures)
- Retrieve group standings (get_standings)
- Pull up a team's World Cup matches (get_team_matches)
- Look up a specific match result (get_match_result)

CRITICAL RULES:
- ALWAYS call a tool before answering any question about fixtures, dates, scores, or standings. Never answer from memory.
- To find when the tournament starts: call get_fixtures with a date range by calling get_standings first to check the season info, or call get_fixtures for upcoming dates.
- If asked when the World Cup starts, call get_fixtures for the next few days to find the first match.
- Never say you "don't have the exact date" — use your tools to find it.
- When making predictions, clearly label them as analysis, not facts.
Today's date: ${new Date().toISOString().slice(0, 10)}.`;
