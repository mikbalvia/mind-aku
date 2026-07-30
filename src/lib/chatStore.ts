import type { ChatMessage } from "../api/types";

const STORE_PREFIX = "new-clients.chat.v1.";

export type StoredChatMessage = ChatMessage & {
  id: string;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  title: string;
  model: string;
  messages: StoredChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type ChatStoreSnapshot = {
  version: 1;
  conversations: ChatConversation[];
  activeId: string | null;
};

function storageKey(apiKeyId: string): string {
  return `${STORE_PREFIX}${apiKeyId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function emptySnapshot(): ChatStoreSnapshot {
  return { version: 1, conversations: [], activeId: null };
}

export function loadChatStore(apiKeyId: string): ChatStoreSnapshot {
  try {
    const raw = localStorage.getItem(storageKey(apiKeyId));
    if (!raw) return emptySnapshot();
    const parsed = JSON.parse(raw) as ChatStoreSnapshot;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.conversations)) {
      return emptySnapshot();
    }
    return {
      version: 1,
      conversations: parsed.conversations.map((c) => ({
        id: c.id,
        title: c.title,
        model: c.model,
        messages: (c.messages ?? []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      activeId: parsed.activeId ?? parsed.conversations[0]?.id ?? null,
    };
  } catch {
    return emptySnapshot();
  }
}

export function clearAllChatStores(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORE_PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveChatStore(apiKeyId: string, snapshot: ChatStoreSnapshot): void {
  try {
    localStorage.setItem(storageKey(apiKeyId), JSON.stringify(snapshot));
  } catch {
    // QuotaExceeded or private mode — ignore; UI still works in-memory.
  }
}

export function createConversation(model: string, title = "New chat"): ChatConversation {
  const ts = nowIso();
  return {
    id: createId("conv"),
    title,
    model,
    messages: [],
    createdAt: ts,
    updatedAt: ts,
  };
}

export function upsertConversation(
  snapshot: ChatStoreSnapshot,
  conversation: ChatConversation
): ChatStoreSnapshot {
  const idx = snapshot.conversations.findIndex((c) => c.id === conversation.id);
  const conversations =
    idx >= 0
      ? snapshot.conversations.map((c, i) => (i === idx ? conversation : c))
      : [conversation, ...snapshot.conversations];
  return {
    ...snapshot,
    conversations,
    activeId: conversation.id,
  };
}

export function deleteConversation(
  snapshot: ChatStoreSnapshot,
  conversationId: string
): ChatStoreSnapshot {
  const conversations = snapshot.conversations.filter((c) => c.id !== conversationId);
  const activeId =
    snapshot.activeId === conversationId ? (conversations[0]?.id ?? null) : snapshot.activeId;
  return { ...snapshot, conversations, activeId };
}

export function setActiveConversation(
  snapshot: ChatStoreSnapshot,
  conversationId: string | null
): ChatStoreSnapshot {
  return { ...snapshot, activeId: conversationId };
}

export function titleFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  return cleaned.length > 48 ? `${cleaned.slice(0, 48)}…` : cleaned;
}

export function appendMessage(
  conversation: ChatConversation,
  message: Omit<StoredChatMessage, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): ChatConversation {
  const next: StoredChatMessage = {
    id: message.id ?? createId("msg"),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt ?? nowIso(),
  };
  return {
    ...conversation,
    messages: [...conversation.messages, next],
    updatedAt: nowIso(),
    title:
      conversation.messages.length === 0 && message.role === "user"
        ? titleFromPrompt(message.content)
        : conversation.title,
  };
}

export function updateMessageContent(
  conversation: ChatConversation,
  messageId: string,
  content: string
): ChatConversation {
  return {
    ...conversation,
    messages: conversation.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
    updatedAt: nowIso(),
  };
}

export function toApiMessages(conversation: ChatConversation): ChatMessage[] {
  return conversation.messages
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
    .map((m) => ({ role: m.role, content: m.content }));
}
