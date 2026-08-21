import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { List } from "@phosphor-icons/react";
import { fetchPaymentsConfig, fetchPortalModels } from "../api/client";
import { streamChatCompletions } from "../api/chat";
import { ApiError } from "../api/types";
import type { ModelItem } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ChatComposer } from "../components/chat/ChatComposer";
import { ChatConversationList } from "../components/chat/ChatConversationList";
import { ChatMessageList } from "../components/chat/ChatMessageList";
import { ErrorBanner } from "../components/page-chrome";
import {
  appendMessage,
  createConversation,
  createId,
  deleteConversation,
  loadChatStore,
  saveChatStore,
  setActiveConversation,
  toApiMessages,
  updateMessageContent,
  upsertConversation,
  type ChatConversation,
  type ChatStoreSnapshot,
} from "../lib/chatStore";
import { formatTokenCount, formatUsd } from "../lib/format";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RemainingQuota = {
  remainingUsd: number | null;
  enabled: boolean;
  tokenRemaining: number | null;
  tokenModels: string[];
};

export function ChatPage() {
  const { t } = useTranslation();
  const { apiKey, status, refreshStatus } = useAuth();
  const apiKeyId = status?.apiKey?.id ?? null;

  const [store, setStore] = useState<ChatStoreSnapshot>({
    version: 1,
    conversations: [],
    activeId: null,
  });
  const [models, setModels] = useState<ModelItem[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const [expiredError, setExpiredError] = useState(false);
  const [remaining, setRemaining] = useState<RemainingQuota | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const storeRef = useRef(store);
  storeRef.current = store;

  const active = useMemo(
    () => store.conversations.find((c) => c.id === store.activeId) ?? null,
    [store]
  );

  const persist = useCallback(
    (next: ChatStoreSnapshot) => {
      storeRef.current = next;
      setStore(next);
      if (apiKeyId) saveChatStore(apiKeyId, next);
    },
    [apiKeyId]
  );

  useEffect(() => {
    if (!apiKeyId) return;
    setStore(loadChatStore(apiKeyId));
  }, [apiKeyId]);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    async function load() {
      setModelsError(null);
      try {
        const [modelRes, payCfg] = await Promise.all([
          fetchPortalModels(apiKey!),
          fetchPaymentsConfig(apiKey!).catch(() => null),
        ]);
        if (cancelled) return;
        const list = modelRes.data ?? [];
        setModels(list);
        setSelectedModel((current) => {
          if (current && list.some((m) => m.id === current)) return current;
          return list[0]?.id ?? "";
        });
        setRemaining({
          enabled: payCfg?.paygBalance?.enabled ?? false,
          remainingUsd: payCfg?.paygBalance?.unlimited ? null : payCfg?.paygBalance?.remainingUsd ?? null,
          tokenRemaining: payCfg?.tokenPackage?.enabled ? payCfg.tokenPackage.remainingTokens : null,
          tokenModels: payCfg?.tokenPackage?.models ?? [],
        });
      } catch (err) {
        if (cancelled) return;
        setModelsError(err instanceof ApiError ? err.message : t("Failed to load models."));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!active || streaming || !selectedModel) return;
    if (active.model === selectedModel) return;
    const updated: ChatConversation = {
      ...active,
      model: selectedModel,
      updatedAt: new Date().toISOString(),
    };
    persist(upsertConversation(storeRef.current, updated));
  }, [selectedModel, active, streaming, persist]);

  const refreshQuota = useCallback(async () => {
    if (!apiKey) return;
    try {
      await refreshStatus();
      const payCfg = await fetchPaymentsConfig(apiKey);
      setRemaining({
        enabled: payCfg.paygBalance?.enabled ?? false,
        remainingUsd: payCfg.paygBalance?.unlimited ? null : payCfg.paygBalance?.remainingUsd ?? null,
        tokenRemaining: payCfg.tokenPackage?.enabled ? payCfg.tokenPackage.remainingTokens : null,
        tokenModels: payCfg.tokenPackage?.models ?? [],
      });
    } catch {
      // non-fatal
    }
  }, [apiKey, refreshStatus]);

  function ensureConversation(): ChatConversation {
    const current = storeRef.current.conversations.find((c) => c.id === storeRef.current.activeId);
    if (current) return current;
    const created = createConversation(selectedModel || models[0]?.id || "");
    persist(upsertConversation(storeRef.current, created));
    return created;
  }

  function handleNewChat() {
    if (streaming) return;
    const created = createConversation(selectedModel || models[0]?.id || "");
    setDraft("");
    setError(null);
    setQuotaError(false);
    setExpiredError(false);
    setSidebarOpen(false);
    persist(upsertConversation(storeRef.current, created));
  }

  function handleSelect(id: string) {
    if (streaming) return;
    const conv = storeRef.current.conversations.find((c) => c.id === id);
    if (conv?.model) setSelectedModel(conv.model);
    setError(null);
    setQuotaError(false);
    setExpiredError(false);
    setSidebarOpen(false);
    persist(setActiveConversation(storeRef.current, id));
  }

  function handleDelete(id: string) {
    if (streaming) return;
    persist(deleteConversation(storeRef.current, id));
  }

  function handleStop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  async function handleSend() {
    if (!apiKey || streaming) return;
    const prompt = draft.trim();
    if (!prompt) return;
    if (!selectedModel) {
      setError(t("Select a model first."));
      return;
    }

    setError(null);
    setQuotaError(false);
    setExpiredError(false);

    let conversation = ensureConversation();
    conversation = { ...conversation, model: selectedModel };
    conversation = appendMessage(conversation, { role: "user", content: prompt });

    const assistantId = createId("msg");
    conversation = appendMessage(conversation, {
      id: assistantId,
      role: "assistant",
      content: "",
    });

    persist(upsertConversation(storeRef.current, conversation));
    setDraft("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages = toApiMessages(conversation).filter(
        (m) => !(m.role === "assistant" && m.content === "")
      );

      let assembled = "";
      for await (const delta of streamChatCompletions(apiKey, {
        model: selectedModel,
        messages: apiMessages,
        signal: controller.signal,
      })) {
        assembled += delta;
        const latest =
          storeRef.current.conversations.find((c) => c.id === conversation.id) ?? conversation;
        const updated = updateMessageContent(latest, assistantId, assembled);
        conversation = updated;
        persist(upsertConversation(storeRef.current, updated));
      }

      const finalConv =
        storeRef.current.conversations.find((c) => c.id === conversation.id) ?? conversation;
      const assistantMsg = finalConv.messages.find((m) => m.id === assistantId);
      if (assistantMsg && !assistantMsg.content.trim() && controller.signal.aborted) {
        const cleaned = {
          ...finalConv,
          messages: finalConv.messages.filter((m) => m.id !== assistantId),
          updatedAt: new Date().toISOString(),
        };
        persist(upsertConversation(storeRef.current, cleaned));
      }

      void refreshQuota();
    } catch (err) {
      if (controller.signal.aborted) {
        // keep partial content
      } else if (err instanceof ApiError) {
        setQuotaError(err.code === "quota");
        setExpiredError(err.code === "expired" || status?.apiKey?.active === false);
        setError(err.message);
        const latest =
          storeRef.current.conversations.find((c) => c.id === conversation.id) ?? conversation;
        const assistantMsg = latest.messages.find((m) => m.id === assistantId);
        if (assistantMsg && !assistantMsg.content.trim()) {
          const cleaned = {
            ...latest,
            messages: latest.messages.filter((m) => m.id !== assistantId),
            updatedAt: new Date().toISOString(),
          };
          persist(upsertConversation(storeRef.current, cleaned));
        }
      } else {
        setError(t("Chat failed. Try again."));
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (!apiKeyId && status === null) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <span className="loading-dot" aria-hidden="true" />
        Loading session…
      </div>
    );
  }

  return (
    <div className="chat-page flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
          <ChatConversationList
            conversations={store.conversations}
            activeId={store.activeId}
            onSelect={handleSelect}
            onCreate={handleNewChat}
            onDelete={handleDelete}
          />
        </aside>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/55"
              aria-label={t("Close conversations")}
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col border-r border-border bg-card shadow-xl">
              <ChatConversationList
                conversations={store.conversations}
                activeId={store.activeId}
                onSelect={handleSelect}
                onCreate={handleNewChat}
                onDelete={handleDelete}
              />
            </div>
          </div>
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2.5 sm:px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label={t("Open conversations")}
              onClick={() => setSidebarOpen(true)}
            >
              <List weight="bold" className="size-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <Select
                value={selectedModel || undefined}
                onValueChange={setSelectedModel}
                disabled={streaming || models.length === 0}
              >
                <SelectTrigger className="h-8 max-w-full min-w-[10rem] sm:min-w-[14rem]">
                  <SelectValue placeholder={t("Select model")} />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {remaining?.tokenRemaining != null || remaining?.enabled ? (
              <p className="shrink-0 text-right text-xs text-muted-foreground">
                {remaining.tokenRemaining != null ? (
                  <>
                    Paket token{" "}
                    <span className="font-semibold text-foreground">
                      {formatTokenCount(remaining.tokenRemaining)}
                    </span>
                  </>
                ) : null}
                {remaining.tokenRemaining != null && remaining.enabled ? " · " : null}
                {remaining.enabled ? (
                  <>
                    USD{" "}
                    <span className="font-semibold text-foreground">
                      {remaining.remainingUsd == null ? t("Unlimited") : formatUsd(remaining.remainingUsd)}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
            {modelsError ? <ErrorBanner message={modelsError} /> : null}
            {error ? (
              <div className="mb-4">
                <ErrorBanner message={error} />
                {quotaError ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("Balance exhausted.")}{" "}
                    <Link
                      to="/payments"
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      {t("Top up here")}
                    </Link>
                    .
                  </p>
                ) : expiredError ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      "Active period expired. Top up at least Rp 100,000 to extend 30 days. Unused balance never expires."
                    )}{" "}
                    <Link
                      to="/payments"
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      {t("Top up here")}
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            ) : null}
            <ChatMessageList messages={active?.messages ?? []} streaming={streaming} />
          </div>

          <div className="shrink-0 border-t border-border bg-muted/20 px-3 py-3 sm:px-5">
            <div className="mx-auto max-w-3xl">
              <ChatComposer
                value={draft}
                onChange={setDraft}
                onSubmit={() => void handleSend()}
                onStop={handleStop}
                disabled={!selectedModel || models.length === 0}
                streaming={streaming}
              />
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                {t("Chat uses your API key via OmniRoute — usage reduces PAYG balance.")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
