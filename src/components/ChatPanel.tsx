"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { OPEN_CHAT_EVENT } from "@/lib/chat-events";
import { BotMessage } from "@/components/BotMessage";
import type { ChatMessage } from "@/types/football";

export const BEEBOT_SESSION_KEY = "beebot_messages";


function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="shrink-0 mt-1">
        <Image src="/ball.png" alt="Soccer ball" width={24} height={24} className="animate-bounce" />
      </div>
      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-3.5 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-bee-yellow animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const t = useTranslations("chat");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = [t("p1"), t("p2"), t("p3"), t("p4")];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, []);

  // Don't render the floating widget on the dedicated BeeBot page
  if (pathname.includes("/beebot")) return null;

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

      // Non-2xx responses are JSON (rate limit, validation errors, etc.)
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      // Read the stream. The server sends optional thinking text followed by \x01,
      // then the streamed final answer. Split on \x01 to render them separately.
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
        const answer   = sepIdx >= 0 ? fullText.slice(sepIdx + 1) : fullText;

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
      const isTooLong = msg.includes("too long") || msg.includes("demasiado");
      const isRateLimit = msg.includes("Too many") || msg.includes("Demasiadas");
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: isRateLimit ? `🚦 ${msg}` : isTooLong ? `✂️ ${msg}` : t("error"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleMaximize() {
    if (messages.length > 0) {
      sessionStorage.setItem(BEEBOT_SESSION_KEY, JSON.stringify(messages));
    }
    router.push(`/${locale}/beebot`);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-bee-yellow shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        aria-label="Toggle BeeBot chat"
      >
        {open ? (
          <span className="text-bee-black text-xl font-bold">✕</span>
        ) : (
          <Image src="/ball.png" alt="Soccer ball" width={36} height={36} className="animate-bounce hover:animate-none cursor-pointer" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 h-[480px] sm:h-[500px] flex flex-col rounded-2xl border border-bee-yellow/30 bg-bee-black shadow-2xl overflow-hidden z-50">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-bee-yellow/10">
            <Image src="/bee.png" alt="BeeBot" width={28} height={28} loading="lazy" />
            <div className="flex-1">
              <p className="font-bold text-bee-yellow text-sm">BeeBot</p>
              <p className="text-[10px] text-gray-400">{t("poweredBy")}</p>
            </div>
            <button
              onClick={handleMaximize}
              title="Open full chat"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                 
                  <div className="bg-white/10 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-100">
                    {t("intro")}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="text-left text-xs px-2.5 py-2 rounded-xl border border-bee-yellow/20 bg-bee-yellow/5 text-gray-300 hover:bg-bee-yellow/10 hover:border-bee-yellow/40 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <BotMessage key={i} message={msg} />
            ))}

            {loading && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-bee-yellow/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-bee-yellow text-bee-black font-bold flex items-center justify-center disabled:opacity-40 hover:bg-yellow-400 transition-colors text-lg"
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </>
  );
}
