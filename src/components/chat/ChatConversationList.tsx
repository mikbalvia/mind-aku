import { Plus, Trash } from "@phosphor-icons/react";
import type { ChatConversation } from "../../lib/chatStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { easeOut } from "../../lib/motion";

export function ChatConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 p-3">
        <Button type="button" className="w-full justify-start gap-2" onClick={onCreate}>
          <Plus weight="bold" className="size-4" />
          New chat
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Belum ada percakapan. Mulai chat baru.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {conversations.map((conv) => {
              const active = conv.id === activeId;
              return (
                <motion.div
                  key={conv.id}
                  layout
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  transition={{ duration: 0.24, ease: easeOut }}
                  className={cn(
                    "group flex items-center gap-1 rounded-xl transition-colors",
                    active ? "bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      "min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm font-medium",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    onClick={() => onSelect(conv.id)}
                    title={conv.title}
                  >
                    {conv.title}
                  </button>
                  <button
                    type="button"
                    className="mr-1 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label={`Delete ${conv.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                  >
                    <Trash weight="bold" className="size-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}