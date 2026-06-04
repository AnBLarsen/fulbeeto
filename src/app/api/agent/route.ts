import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, SYSTEM_PROMPT } from "@/lib/agent-tools";
import { getFixtures, getStandings, getTeamMatches, getMatchResult } from "@/lib/football-api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ChatMessage } from "@/types/football";

const client = new Anthropic();

// ─── Limits ───────────────────────────────────────────────────────────────────
const RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 }; // 20 req / IP / hour
const MAX_MESSAGE_LENGTH = 500;   // chars per user message
const MAX_HISTORY_MESSAGES = 20;  // total messages kept in context
const MAX_REQUEST_BYTES = 32_000; // ~32KB max body

// ─── Tool execution ───────────────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case "get_fixtures": {
        const matches = await getFixtures(
          input.date as string | undefined,
          input.dateFrom as string | undefined,
          input.dateTo as string | undefined
        );
        if (!matches.length) return "No matches found for that date range.";
        return JSON.stringify(matches, null, 2);
      }
      case "get_standings": {
        const data = await getStandings(input.group as string | undefined);
        return JSON.stringify(data.standings, null, 2);
      }
      case "get_team_matches": {
        const matches = await getTeamMatches(input.teamId as number);
        if (!matches.length) return `No World Cup matches found for team ${input.teamName ?? input.teamId}.`;
        return JSON.stringify(matches, null, 2);
      }
      case "get_match_result": {
        const match = await getMatchResult(input.matchId as number);
        if (!match) return `No match found for ID ${input.matchId}.`;
        return JSON.stringify(match, null, 2);
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : "Tool error"}`;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip, RATE_LIMIT);
  if (!rate.allowed) {
    const resetIn = Math.ceil((rate.resetAt - Date.now()) / 1000 / 60);
    return NextResponse.json(
      { error: `Too many requests. Try again in ${resetIn} minute${resetIn !== 1 ? "s" : ""}.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMIT.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
        },
      }
    );
  }

  // 2. Body size check
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  // 3. Parse + validate body
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body?.messages;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array is required." }, { status: 400 });
  }

  // 4. Validate each message
  for (const msg of messages) {
    if (msg.role !== "user" && msg.role !== "assistant") {
      return NextResponse.json({ error: "Invalid message role." }, { status: 400 });
    }
    if (typeof msg.content !== "string") {
      return NextResponse.json({ error: "Message content must be a string." }, { status: 400 });
    }
    if (msg.role === "user" && msg.content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }
  }

  // 5. Trim history to prevent context bloat
  const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);

  // 6. Agentic loop
  try {
    const anthropicMessages: Anthropic.MessageParam[] = trimmed.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      messages: anthropicMessages,
    });

    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: await executeTool(block.name, block.input as Record<string, unknown>),
        }))
      );

      anthropicMessages.push({ role: "assistant", content: response.content });
      anthropicMessages.push({ role: "user", content: toolResults });

      response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
        messages: anthropicMessages,
      });
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );

    return NextResponse.json(
      { reply: textBlock?.text ?? "I couldn't generate a response." },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT.limit),
          "X-RateLimit-Remaining": String(rate.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Agent API]", message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
