import { type FormEvent, type KeyboardEvent } from "react";
import { PaperPlaneTilt, Stop } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "motion/react";
import { easeOut } from "../../lib/motion";

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  streaming,
  placeholder = "Message Mind Aku…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  disabled?: boolean;
  streaming: boolean;
  placeholder?: string;
}) {
  const canSend = !disabled && !streaming && value.trim().length > 0;
  const reduced = useReducedMotion();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    onSubmit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: easeOut }}
      className="rounded-2xl border border-border bg-card p-2 shadow-sm"
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={disabled || streaming}
        placeholder={placeholder}
        className="max-h-40 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
      />

      <div className="flex items-center justify-end gap-2 px-1 pb-1">
        {streaming ? (
          <motion.div whileTap={reduced ? undefined : { scale: 0.96 }}>
            <Button type="button" variant="outline" size="sm" onClick={onStop}>
              <Stop weight="fill" className="size-3.5" />
              Stop
            </Button>
          </motion.div>
        ) : (
          <motion.div whileTap={reduced ? undefined : { scale: 0.96 }}>
            <Button type="submit" size="sm" disabled={!canSend}>
              <PaperPlaneTilt weight="fill" className="size-3.5" />
              Send
            </Button>
          </motion.div>
        )}
      </div>
    </motion.form>
  );
}