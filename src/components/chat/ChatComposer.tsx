import { type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border/80 bg-card/90 p-2 shadow-sm backdrop-blur-sm"
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
          <Button type="button" variant="outline" size="sm" onClick={onStop}>
            <Square className="size-3.5 fill-current" />
            Stop
          </Button>
        ) : (
          <Button type="submit" size="sm" disabled={!canSend}>
            <SendHorizontal className="size-3.5" />
            Send
          </Button>
        )}
      </div>
    </form>
  );
}
