const REF_STORAGE_KEY = "new-clients.affiliate.ref";

type StoredRef = {
  code: string;
  expiresAt: number;
};

function readStored(): StoredRef | null {
  try {
    const raw = localStorage.getItem(REF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRef;
    if (!parsed?.code || typeof parsed.expiresAt !== "number") return null;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(REF_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Capture ?ref= on first touch; keep for cookieDays (default 30). */
export function captureReferralFromUrl(cookieDays = 30): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = (params.get("ref") || "").trim().toUpperCase();
  if (!code) return getStoredReferralCode();
  const days = cookieDays > 0 ? cookieDays : 30;
  const existing = readStored();
  // First-touch: do not overwrite an existing valid code.
  if (existing) return existing.code;
  const payload: StoredRef = {
    code,
    expiresAt: Date.now() + days * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(REF_STORAGE_KEY, JSON.stringify(payload));
  return code;
}

export function getStoredReferralCode(): string | null {
  return readStored()?.code ?? null;
}

export function clearStoredReferralCode(): void {
  localStorage.removeItem(REF_STORAGE_KEY);
}

const ADMIN_KEY_STORAGE = "new-clients.portalAdminKey";

export function getPortalAdminKey(): string | null {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE);
}

export function setPortalAdminKey(key: string): void {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
}

export function clearPortalAdminKey(): void {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}
