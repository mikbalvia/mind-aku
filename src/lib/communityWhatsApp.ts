/** localStorage helpers for WhatsApp announcement-channel join UX. */

const JOINED_KEY = "new-clients.community.whatsapp.joined";
const DISMISSED_AT_KEY = "new-clients.community.whatsapp.dismissedAt";
const DISMISSED_CAMPAIGN_KEY = "new-clients.community.whatsapp.dismissedCampaignId";

/** Re-show soft modal after this cooldown unless a new campaign id arrives sooner. */
export const COMMUNITY_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Feature announcement ids currently mounted in AppShell.
 * Community modal waits until these are dismissed (anti double-modal).
 */
export const BLOCKING_ANNOUNCEMENT_IDS = ["vscode-chat-2026-08-10"] as const;

function announcementDismissKey(id: string) {
  return `new-clients.announcement.dismissed.${id}`;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

export function isCommunityJoined(): boolean {
  return read(JOINED_KEY) === "1";
}

export function markCommunityJoined() {
  write(JOINED_KEY, "1");
}

export function isFeatureAnnouncementBlocking(): boolean {
  return BLOCKING_ANNOUNCEMENT_IDS.some(
    (id) => read(announcementDismissKey(id)) !== "1"
  );
}

export function dismissCommunityModal(campaignId: string | null) {
  write(DISMISSED_AT_KEY, String(Date.now()));
  write(DISMISSED_CAMPAIGN_KEY, campaignId ?? "");
}

/**
 * Soft modal visibility:
 * - hide if already joined
 * - hide while another feature announcement is open
 * - show if never dismissed
 * - show if dismiss cooldown elapsed
 * - show if active campaign id differs from last dismissed campaign
 */
export function shouldShowCommunityModal(campaignId: string | null): boolean {
  if (isCommunityJoined()) return false;
  if (isFeatureAnnouncementBlocking()) return false;

  const dismissedAtRaw = read(DISMISSED_AT_KEY);
  if (!dismissedAtRaw) return true;

  const dismissedCampaignId = read(DISMISSED_CAMPAIGN_KEY) ?? "";
  if (campaignId && campaignId !== dismissedCampaignId) return true;

  const dismissedAt = Number(dismissedAtRaw);
  if (!Number.isFinite(dismissedAt)) return true;
  return Date.now() - dismissedAt >= COMMUNITY_DISMISS_COOLDOWN_MS;
}
