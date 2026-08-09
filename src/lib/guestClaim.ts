import { GUEST_CLAIM_SECRET_PREFIX } from "../config";

export function storeGuestClaimSecret(orderId: string, claimSecret: string) {
  try {
    sessionStorage.setItem(`${GUEST_CLAIM_SECRET_PREFIX}${orderId}`, claimSecret);
  } catch {
    // ignore storage errors
  }
}

export function readGuestClaimSecret(orderId: string): string | null {
  try {
    return sessionStorage.getItem(`${GUEST_CLAIM_SECRET_PREFIX}${orderId}`);
  } catch {
    return null;
  }
}

export function clearGuestClaimSecret(orderId: string) {
  try {
    sessionStorage.removeItem(`${GUEST_CLAIM_SECRET_PREFIX}${orderId}`);
  } catch {
    // ignore
  }
}
