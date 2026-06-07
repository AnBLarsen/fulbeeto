"use client";

import { openChat } from "@/lib/chat-events";

interface OpenChatHintProps {
  children: React.ReactNode;
  className?: string;
}

export function OpenChatHint({ children, className = "" }: OpenChatHintProps) {
  return (
    <button
      onClick={openChat}
      className={`cursor-pointer hover:opacity-80 active:scale-95 transition-all ${className}`}
    >
      {children}
    </button>
  );
}
