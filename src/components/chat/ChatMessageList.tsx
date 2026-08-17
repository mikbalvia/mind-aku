import { useEffect, useRef } from "react";
import type { StoredChatMessage } from "../../lib/chatStore";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { easeOut } from "../../lib/motion";

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
          className="my-2 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[12px] leading-relaxed text-foreground"
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
  const reduced = useReducedMotion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
  }, [messages, streaming, reduced]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-[14rem] flex-col items-center justify-center px-6 text-center">
        <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
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
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <motion.div
              key={message.id}
              layout
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: easeOut }}
              className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%]",
                  isUser
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border border-border bg-card text-foreground"
                )}
              >
                {!isUser ? (
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Assistant
                  </p>
                ) : null}
                <div>{renderPlainContent(message.content)}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {streaming ? (
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-1 text-xs text-muted-foreground"
        >
          <span className="loading-dot" aria-hidden="true" />
          Generating…
        </motion.p>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}