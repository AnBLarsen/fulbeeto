"use client";

import Image from "next/image";
import type { ChatMessage } from "@/types/football";

interface BotMessageProps {
  message: ChatMessage;
  avatarSize?: number;
}

export function BotMessage({ message, avatarSize = 24 }: BotMessageProps) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="shrink-0 mt-1">
          <Image
            src="/bee.png"
            alt="BeeBot"
            width={avatarSize}
            height={avatarSize}
            loading="lazy"
          />
        </div>
      )}
      <div className={`flex flex-col gap-1.5 ${isUser ? "" : "max-w-[85%]"}`}>
        {/* Thinking block */}
        {message.thinking && (
          <div className="text-[11px] text-gray-500 bg-white/5 rounded-xl rounded-tl-sm px-3 py-2 italic leading-relaxed whitespace-pre-wrap">
            <span className="not-italic text-gray-600 font-medium">🔍 </span>
            {message.thinking}
          </div>
        )}
        {/* Answer bubble */}
        {(message.content || isUser) && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "bg-bee-yellow text-bee-black font-medium rounded-tr-sm max-w-[80vw] sm:max-w-xs"
                : "bg-white/10 text-gray-100 rounded-tl-sm"
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}
