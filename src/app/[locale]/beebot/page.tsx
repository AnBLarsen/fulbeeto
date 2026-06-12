"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { BotMessage } from "@/components/BotMessage";
import { BEEBOT_SESSION_KEY } from "@/components/ChatPanel";
import type { ChatMessage } from "@/types/football";

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-1">
        <Image src="/ball.png" alt="Thinking" width={32} height={32} className="animate-bounce" />
      </div>
      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-bee-yellow animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function BeeBotPage() {
  const t = useTranslations("chat");
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const SUGGESTED_PROMPTS = [t("p1"), t("p2"), t("p3"), t("p4")];

  // Restore conversation on mount (from widget maximize or previous visit this tab)
  useEffect(() => {
    const saved = sessionStorage.getItem(BEEBOT_SESSION_KEY);
    if (saved) {
      try {
        const parsed: ChatMessage[] = JSON.parse(saved);
        if (parsed.length > 0) setMessages(parsed);
      } catch {}
    }
  }, []);

  // Keep sessionStorage in sync so navigating away and back restores the chat
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(BEEBOT_SESSION_KEY, JSON.stringify(messages));
    } else {
      sessionStorage.removeItem(BEEBOT_SESSION_KEY);
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        fullText += chunk;
        const sepIdx = fullText.indexOf("\x01");
        const thinking = sepIdx >= 0 ? fullText.slice(0, sepIdx) : undefined;
        const answer = sepIdx >= 0 ? fullText.slice(sepIdx + 1) : fullText;

        setMessages([...updated, {
          role: "assistant",
          content: answer,
          thinking: thinking || undefined,
        }]);
      }

      const sepIdx = fullText.indexOf("\x01");
      const finalAnswer = sepIdx >= 0 ? fullText.slice(sepIdx + 1) : fullText;
      if (!finalAnswer.trim()) {
        setMessages([...updated, { role: "assistant", content: t("error") }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isRateLimit = msg.includes("Too many") || msg.includes("Demasiadas");
      const isTooLong = msg.includes("too long") || msg.includes("demasiado");
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: isRateLimit ? `🚦 ${msg}` : isTooLong ? `✂️ ${msg}` : t("error"),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div
      className="-mx-4 -mt-6 flex flex-col"
      style={{ height: "calc(100dvh - 65px)" }}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 bg-bee-yellow/5 px-4 py-4">
        <div className="relative flex items-center justify-center gap-2 mb-0.5">
          <Image src="/bee.png" alt="BeeBot" width={32} height={32} />
          <h1 className="text-xl font-black text-bee-yellow">BeeBot</h1>
          <button
            onClick={() => router.back()}
            title="Minimize"
            className="absolute right-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="10" y1="14" x2="3" y2="21" />
              <line x1="21" y1="3" x2="14" y2="10" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">{t("poweredBy")}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-5">
              {/* Intro bubble */}
              <div className="flex gap-3">
                <div className="shrink-0 mt-1">
                  <Image src="/bee.png" alt="BeeBot" width={32} height={32} loading="lazy" />
                </div>
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-100 leading-relaxed max-w-lg">
                  {t("intro")}
                </div>
              </div>

              {/* Suggested prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11 max-w-lg">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-bee-yellow/20 bg-bee-yellow/5 text-gray-300 hover:bg-bee-yellow/10 hover:border-bee-yellow/40 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <BotMessage key={i} message={msg} avatarSize={32} />
          ))}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <TypingIndicator />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 bg-bee-black/80 backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto px-4 py-3 flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-bee-yellow/50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-bee-yellow text-bee-black font-bold flex items-center justify-center disabled:opacity-40 hover:bg-yellow-400 transition-colors text-lg shrink-0"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
