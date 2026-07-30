import { useEffect, useRef } from "react";
import type { StoredChatMessage } from "../../lib/chatStore";
import { cn } from "@/lib/utils";

function renderPlainContent(content: string) {
  // Lightweight: split fenced code blocks, escape nothing needed with text nodes via React.
  const parts: Array<{ type: "text" | "code"; value: string }> = [];
  const fence = /```(?:[\w-]+)?\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: content.slice(last, match.index) });
    }
    parts.push({ type: "code", value: match[1].replace(/\n$/, "") });
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    parts.push({ type: "text", value: content.slice(last) });
  }
  if (parts.length === 0) parts.push({ type: "text", value: content });

  return parts.map((part, i) => {
    if (part.type === "code") {
      return (
        <pre
          key={i}
          className="my-2 overflow-x-auto rounded-lg border border-border bg-background/80 p-3 font-mono text-[12px] leading-relaxed text-foreground"
        >
          <code>{part.value}</code>
        </pre>
      );
    }
    return (
      <span key={i} className="whitespace-pre-wrap break-words">
        {part.value}
      </span>
    );
  });
}

export function ChatMessageList({
  messages,
  streaming,
}: {
  messages: StoredChatMessage[];
  streaming: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-[14rem] flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl font-medium tracking-tight text-foreground">
          Chat Mind Aku
        </p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Tanya apa saja. Setiap pesan memakai quota lifetime kamu.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-1 py-2">
      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%]",
                isUser
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "border border-border/80 bg-card/90 text-foreground backdrop-blur-sm"
              )}
            >
              {!isUser ? (
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Assistant
                </p>
              ) : null}
              <div>{renderPlainContent(message.content)}</div>
            </div>
          </div>
        );
      })}
      {streaming ? (
        <p className="px-1 text-xs text-muted-foreground">
          <span className="loading-dot" aria-hidden="true" />
          Generating…
        </p>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}
