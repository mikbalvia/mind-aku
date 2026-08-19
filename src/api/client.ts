import { OMNIROUTE_BASE_URL } from "../config";
import {
  ApiError,
  type LogsQuery,
  type LogsResponse,
  type MeStatus,
  type ModelsResponse,
  type CallLog,
  type PaymentsConfig,
  type PaymentCreateResponse,
  type PaymentsListResponse,
  type ShopCheckoutResponse,
  type ShopClaimResponse,
  type ShopConfig,
  type AffiliateSummary,
  type AffiliateLedgerItem,
  type AffiliateReferralItem,
  type AdminAffiliateReferralItem,
  type AffiliateWithdrawalItem,
} from "./types";

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  let message = fallback;
  try {
    const body = (await response.json()) as { error?: unknown; message?: unknown };
    const raw = body?.error ?? body?.message;
    if (typeof raw === "string" && raw.trim()) message = raw;
    else if (raw && typeof raw === "object") {
      const nested = (raw as { message?: unknown }).message;
      if (typeof nested === "string" && nested.trim()) message = nested;
    }
  } catch {
    // ignore parse errors
  }
  return message;
}

async function requestPublic<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${OMNIROUTE_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("Unable to reach Mind Aku. Check the base URL and CORS settings.", 0, "network");
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response, `Request failed (${response.status})`);
    throw new ApiError(message, response.status, "unknown");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function request<T>(
  path: string,
  apiKey: string,
  init?: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${OMNIROUTE_BASE_URL}${path}`, {
      ...init,
      // Bypass HTTP cache. The auth/rehydrate path can otherwise lock onto a
      // stale cached 404 (e.g. when the gateway was restarted or the route was
      // added later) and force users into a confusing "Invalid URL" loop on
      // already-open tabs. incognito tabs avoid this because they start with
      // an empty cache.
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("Unable to reach Mind Aku. Check the base URL and CORS settings.", 0, "network");
  }

  if (response.status === 401) {
    throw new ApiError("Invalid or expired API key.", 401, "unauthorized");
  }
  if (response.status === 403) {
    throw new ApiError(
      "This API key is not allowed to access the customer portal.",
      403,
      "forbidden"
    );
  }
  if (!response.ok) {
    const message = await parseErrorMessage(response, `Request failed (${response.status})`);
    throw new ApiError(message, response.status, "unknown");
  }

  return (await response.json()) as T;
}

export function fetchMeStatus(apiKey: string): Promise<MeStatus> {
  return request<MeStatus>("/api/v1/me/status", apiKey);
}

export function fetchModels(apiKey: string): Promise<ModelsResponse> {
  return request<ModelsResponse>("/v1/models", apiKey);
}

export function fetchPortalModels(apiKey: string): Promise<ModelsResponse> {
  return request<ModelsResponse>("/api/v1/me/models", apiKey);
}

export function fetchPublicPortalModels(): Promise<ModelsResponse> {
  return requestPublic<ModelsResponse>("/api/v1/me/models");
}

export function fetchLogs(apiKey: string, query: LogsQuery = {}): Promise<LogsResponse> {
  const params = new URLSearchParams();
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.offset != null) params.set("offset", String(query.offset));
  if (query.status) params.set("status", query.status);
  if (query.model) params.set("model", query.model);
  if (query.search) params.set("search", query.search);
  const qs = params.toString();
  return request<LogsResponse>(`/api/v1/me/logs${qs ? `?${qs}` : ""}`, apiKey);
}

export function fetchLogDetail(apiKey: string, id: string): Promise<CallLog> {
  return request<CallLog>(`/api/v1/me/logs/${encodeURIComponent(id)}`, apiKey);
}

export function fetchPaymentsConfig(apiKey: string): Promise<PaymentsConfig> {
  return request<PaymentsConfig>("/api/v1/me/payments/config", apiKey);
}

export function fetchPayments(apiKey: string): Promise<PaymentsListResponse> {
  return request<PaymentsListResponse>("/api/v1/me/payments", apiKey);
}

export function createPayment(
  apiKey: string,
  body: {
    usdAmount?: number;
    amountIdr?: number;
    successReturnUrl?: string;
    cancelReturnUrl?: string;
    paymentMethodTypeCode?: string;
    refCode?: string;
  }
): Promise<PaymentCreateResponse> {
  return request<PaymentCreateResponse>("/api/v1/me/payments", apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function simulatePayment(
  apiKey: string,
  paymentId: string
): Promise<{
  ok: boolean;
  applied: boolean;
  alreadyCredited?: boolean;
  orderId: string;
  usdCredit: number;
  status?: string;
  credited?: boolean;
}> {
  return request(`/api/v1/me/payments/${encodeURIComponent(paymentId)}/simulate`, apiKey, {
    method: "POST",
  });
}

export function fetchShopConfig(): Promise<ShopConfig> {
  return requestPublic<ShopConfig>("/api/v1/shop/config");
}

export function createShopCheckout(body: {
  name: string;
  successReturnUrl?: string;
  cancelReturnUrl?: string;
  paymentMethodTypeCode?: string;
  turnstileToken?: string;
  refCode?: string;
}): Promise<ShopCheckoutResponse> {
  return requestPublic<ShopCheckoutResponse>("/api/v1/shop/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function claimShopOrder(body: {
  orderId: string;
  claimSecret: string;
}): Promise<ShopClaimResponse> {
  let response: Response;
  try {
    response = await fetch(`${OMNIROUTE_BASE_URL}/api/v1/shop/claim`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Unable to reach Mind Aku. Check the base URL and CORS settings.", 0, "network");
  }

  // 202 Accepted = payment still pending (webhook not applied yet).
  if (response.status === 202 || response.ok) {
    return (await response.json()) as ShopClaimResponse;
  }

  const message = await parseErrorMessage(response, `Request failed (${response.status})`);
  throw new ApiError(message, response.status, "unknown");
}

export function simulateShopOrder(
  orderId: string,
  claimSecret: string
): Promise<{
  ok: boolean;
  applied: boolean;
  alreadyCredited?: boolean;
  orderId: string;
  usdCredit: number;
  status?: string;
  credited?: boolean;
}> {
  return requestPublic(`/api/v1/shop/orders/${encodeURIComponent(orderId)}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claimSecret }),
  });
}

export function fetchAffiliate(apiKey: string): Promise<AffiliateSummary> {
  return request<AffiliateSummary>("/api/v1/me/affiliate", apiKey);
}

export function enableAffiliate(apiKey: string): Promise<AffiliateSummary> {
  return request<AffiliateSummary>("/api/v1/me/affiliate/enable", apiKey, { method: "POST" });
}

export function fetchAffiliateLedger(
  apiKey: string
): Promise<{ data: AffiliateLedgerItem[]; total: number }> {
  return request("/api/v1/me/affiliate/ledger", apiKey);
}

export function fetchAffiliateReferrals(
  apiKey: string
): Promise<{ data: AffiliateReferralItem[]; total: number }> {
  return request("/api/v1/me/affiliate/referrals", apiKey);
}

export function fetchAffiliateWithdrawals(
  apiKey: string
): Promise<{ data: AffiliateWithdrawalItem[]; total: number }> {
  return request("/api/v1/me/affiliate/withdrawals", apiKey);
}

export function createAffiliateWithdrawal(
  apiKey: string,
  body: {
    usdAmount: number;
    bankName: string;
    bankAccount: string;
    accountName: string;
    note?: string;
  }
): Promise<AffiliateWithdrawalItem> {
  return request("/api/v1/me/affiliate/withdrawals", apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function requestAdmin<T>(path: string, adminKey: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${OMNIROUTE_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Portal-Admin-Key": adminKey,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("Unable to reach Mind Aku. Check the base URL and CORS settings.", 0, "network");
  }
  if (response.status === 401) {
    throw new ApiError("Invalid admin key.", 401, "unauthorized");
  }
  if (response.status === 404) {
    throw new ApiError("Admin API is not configured.", 404, "unknown");
  }
  if (!response.ok) {
    const message = await parseErrorMessage(response, `Request failed (${response.status})`);
    throw new ApiError(message, response.status, "unknown");
  }
  return (await response.json()) as T;
}

export function fetchAdminWithdrawals(
  adminKey: string,
  status?: string
): Promise<{ data: AffiliateWithdrawalItem[]; total: number }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return requestAdmin(`/api/v1/admin/affiliate/withdrawals${qs}`, adminKey);
}

export function patchAdminWithdrawal(
  adminKey: string,
  id: number,
  body: { status: string; adminNote?: string }
): Promise<AffiliateWithdrawalItem> {
  return requestAdmin(`/api/v1/admin/affiliate/withdrawals/${id}`, adminKey, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function fetchAdminAffiliateStats(adminKey: string): Promise<{
  unpaidLiabilityUsd: number;
  pendingWithdrawals: number;
  commissionRate: number;
  buyerBonusRate: number;
}> {
  return requestAdmin("/api/v1/admin/affiliate/stats", adminKey);
}

export function fetchAdminAffiliateReferrals(
  adminKey: string,
  affCode?: string
): Promise<{ data: AdminAffiliateReferralItem[]; total: number }> {
  const qs = affCode ? `?affCode=${encodeURIComponent(affCode)}` : "";
  return requestAdmin(`/api/v1/admin/affiliate/referrals${qs}`, adminKey);
}
