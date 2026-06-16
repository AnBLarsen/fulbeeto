import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, SYSTEM_PROMPT } from "@/lib/agent-tools";
import { getFixtures, getStandings, getTeamMatches, getMatchResult, getTeamDetail } from "@/lib/football-api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ChatMessage } from "@/types/football";

// Allow up to 60 s on Vercel — the agentic loop + streaming can exceed the 10 s default
export const maxDuration = 60;

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
      case "get_squad": {
        const team = await getTeamDetail(input.teamId as number);
        if (!team) return `Squad data unavailable for team ID ${input.teamId}. Do NOT guess — tell the user you could not retrieve the squad.`;
        if (!team.squad?.length) return `Squad data unavailable for ${input.teamName ?? team.name}. The API may not provide roster data at this subscription tier. Do NOT guess — tell the user you could not retrieve the squad.`;
        return JSON.stringify({ team: team.name, coach: team.coach, squad: team.squad }, null, 2);
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Tool error";
    // Rate limit: return a user-friendly message Claude can relay without quoting raw API errors
    if (msg.startsWith("RATE_LIMITED:")) {
      return "The football data API is temporarily rate-limited. Tell the user: \"I hit the data API's request limit — please wait about a minute and ask me again.\"";
    }
    return `Error: ${msg}`;
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

  // 6. Two-phase agentic loop:
  //    Phase 1 — non-streaming tool calls (collect thinking text)
  //    Phase 2 — stream the final answer, preceded by \x01 separator if there was thinking
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const currentMessages: Anthropic.MessageParam[] = trimmed.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // ── Phase 1: tool-use loop (non-streaming) ────────────────────────────
        let thinkingText = "";

        let response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: AGENT_TOOLS,
          messages: currentMessages,
        });

        while (response.stop_reason === "tool_use") {
          // Collect any reasoning text Claude generated before the tool call
          const text = response.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("");
          if (text.trim()) {
            thinkingText += (thinkingText ? "\n\n" : "") + text.trim();
          }

          // Execute tools
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
          currentMessages.push({ role: "assistant", content: response.content });
          currentMessages.push({ role: "user", content: toolResults });

          response = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: AGENT_TOOLS,
            messages: currentMessages,
          });
        }

        // ── Phase 2: send thinking block + stream final answer ─────────────────
        // \x01 is the separator: everything before = thinking, after = answer
        if (thinkingText) {
          controller.enqueue(encoder.encode(thinkingText + "\x01"));
        }

        const finalStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: AGENT_TOOLS,
          messages: currentMessages,
        });

        for await (const event of finalStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Agent API]", message);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no", // prevent Vercel/nginx from buffering the stream
      "Cache-Control": "no-cache",
      "X-RateLimit-Limit": String(RATE_LIMIT.limit),
      "X-RateLimit-Remaining": String(rate.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
    },
  });
}
