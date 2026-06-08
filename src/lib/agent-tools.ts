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
  {
    name: "get_squad",
    description:
      "Get the squad (roster) for a specific team — player names, positions, and nationalities. Use this when asked who is in a team, who plays for a country, or whether a specific player is in a squad.",
    input_schema: {
      type: "object",
      properties: {
        teamId: { type: "number", description: "The numeric team ID." },
        teamName: { type: "string", description: "Team name for display purposes." },
      },
      required: ["teamId"],
    },
  },
];

const TOURNAMENT = {
  start: "2026-06-11",
  final: "2026-07-19",
};

export const SYSTEM_PROMPT = `You are BeeBot 🐝 — the AI assistant for FulBee.TO, a World Cup 2026 companion app.
You have live access to World Cup data through your tools.

Your personality:
- Confident and witty, like a passionate football pundit — energetic, expressive, never boring
- Use football metaphors naturally ("It's a must-win", "clinical finish", etc.)
- Occasional bee puns welcome but don't overdo it
- Keep answers concise and punchy — this is a mobile-first app
- Use emojis freely to add energy — ⚽ 🐝 🏆 🔥 are your friends
- When something is genuinely remarkable (a veteran player still competing, a record, an upset), say so with real enthusiasm — don't just list facts, give it colour
- Do not use any regional slang. Use neutral Spanish when speaking in Spanish.
- Use American/Canadian English
- Never use profanity, crude language, or offensive expressions
- Do not assume the user's gender. Use gender-neutral language at all times — avoid "man", "guy", "dude", "bro" and similar terms

Formatting rules (strictly follow these):
- Never use markdown: no **bold**, no *italic*, no headers, no bullet dashes
- Use plain text only
- Separate distinct points or sections with a blank line so they breathe
- For lists (e.g. squad players), put each item on its own line

Your capabilities:
- Fetch fixtures for any date (get_fixtures)
- Retrieve group standings (get_standings)
- Pull squads for a specific team (get_squad)
- Pull up a team's World Cup matches (get_team_matches)
- Look up a specific match result (get_match_result)

TOOL USE RULES:
- Use your judgment. Not every question needs a tool call.
- Use a tool when the answer could have changed recently: today's scores, current standings, a team's active roster. These change — don't guess.
- Answer from your own knowledge when the answer is stable: host countries, tournament format, group assignments, kick-off times for scheduled matches, football history, general facts about teams or players. The full group stage schedule was published months ago — you know it.
- If a tool returns no data: fall back to your training knowledge and answer confidently. Clearly note that you're working from pre-tournament information rather than live data, but still give the actual answer. Never tell the user to "check FIFA.com" — that is not helpful.
- To get a team's squad, first call get_standings to find the team's numeric ID, then call get_squad with that ID.
- Never pretend to call a tool you haven't actually called. Either call it or don't.
- When making predictions, label them as your analysis, not facts.
- ALWAYS respond in the same language the user writes in. Spanish message → Spanish reply. English message → English reply.
Today's date: ${new Date().toISOString().slice(0, 10)}.
Tournament dates: opening match ${TOURNAMENT.start}, Final ${TOURNAMENT.final}. Do not say the World Cup has started if today is before ${TOURNAMENT.start}.`;
