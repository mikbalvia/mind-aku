import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchMeStatus } from "../api/client";
import { ApiError } from "../api/types";
import type { MeStatus } from "../api/types";
import { REMEMBER_KEY, SESSION_KEY } from "../config";
import { clearAllChatStores } from "../lib/chatStore";
import { REHYDRATE_ERROR_EVENT } from "./constants";

type LoginOptions = {
  remember?: boolean;
};

type AuthContextValue = {
  apiKey: string | null;
  status: MeStatus | null;
  loading: boolean;
  login: (apiKey: string, options?: LoginOptions) => Promise<void>;
  logout: () => void;
  refreshStatus: () => Promise<MeStatus | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredKey(): string | null {
  try {
    const fromSession = sessionStorage.getItem(SESSION_KEY);
    if (fromSession) return fromSession;
  } catch {
    // ignore
  }
  try {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      // Mirror into session for this tab so mid-session code paths stay consistent.
      try {
        sessionStorage.setItem(SESSION_KEY, remembered);
      } catch {
        // ignore
      }
      return remembered;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeSessionKey(apiKey: string | null) {
  try {
    if (apiKey) sessionStorage.setItem(SESSION_KEY, apiKey);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

function writeRememberKey(apiKey: string | null) {
  try {
    if (apiKey) localStorage.setItem(REMEMBER_KEY, apiKey);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // ignore storage errors
  }
}

function clearStoredKeys() {
  writeSessionKey(null);
  writeRememberKey(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(() => readStoredKey());
  const [status, setStatus] = useState<MeStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    clearStoredKeys();
    clearAllChatStores();
    setApiKey(null);
    setStatus(null);
  }, []);

  const login = useCallback(async (nextKey: string, options?: LoginOptions) => {
    const trimmed = nextKey.trim();
    if (!trimmed) throw new ApiError("API key is required.", 400, "unknown");
    setLoading(true);
    try {
      const me = await fetchMeStatus(trimmed);
      writeSessionKey(trimmed);
      if (options?.remember) writeRememberKey(trimmed);
      else writeRememberKey(null);
      setApiKey(trimmed);
      setStatus(me);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!apiKey) return null;
    setLoading(true);
    try {
      const me = await fetchMeStatus(apiKey);
      setStatus(me);
      return me;
    } catch (error) {
      if (error instanceof ApiError && error.code === "unauthorized") {
        logout();
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiKey, logout]);

  // Rehydrate key metadata after a page reload with a stored session.
  useEffect(() => {
    if (!apiKey || status) return;
    let cancelled = false;
    setLoading(true);
    fetchMeStatus(apiKey)
      .then((me) => {
        if (!cancelled) setStatus(me);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === "unauthorized") {
          logout();
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Saved session expired. Please sign in again.";
        try {
          window.dispatchEvent(new CustomEvent(REHYDRATE_ERROR_EVENT, { detail: message }));
        } catch {
          // ignore
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey, status, logout]);

  const value = useMemo(
    () => ({ apiKey, status, loading, login, logout, refreshStatus }),
    [apiKey, status, loading, login, logout, refreshStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
