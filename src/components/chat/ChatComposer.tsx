import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { Paperclip, SendHorizontal, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PendingAttachment = {
  id: string;
  name: string;
  charCount: number;
  truncated: boolean;
  extracting?: boolean;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  onAttachFiles,
  onRemoveAttachment,
  attachments,
  disabled,
  streaming,
  placeholder = "Message Mind Aku…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onAttachFiles: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  attachments: PendingAttachment[];
  disabled?: boolean;
  streaming: boolean;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
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
      {attachments.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2 px-1 pt-1">
          {attachments.map((file) => (
            <span
              key={file.id}
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-background/70 px-2 py-1 text-xs text-foreground",
                file.extracting && "opacity-70"
              )}
              title={
                file.truncated
                  ? `${file.name} (truncated)`
                  : `${file.name} · ${file.charCount.toLocaleString()} chars`
              }
            >
              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{file.name}</span>
              {file.truncated ? (
                <span className="shrink-0 text-[10px] uppercase text-[var(--signal)]">cut</span>
              ) : null}
              {!file.extracting ? (
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemoveAttachment(file.id)}
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={disabled || streaming}
        placeholder={placeholder}
        className="max-h-40 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
      />

      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <div className="flex items-center gap-1">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json,.log,text/*,application/pdf,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) onAttachFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || streaming}
            aria-label="Attach document"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="size-4" />
          </Button>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            PDF, DOCX, TXT, MD
          </span>
        </div>

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
