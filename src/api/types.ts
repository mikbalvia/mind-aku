export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "network"
  | "quota"
  | "rate_limit"
  | "unknown";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatCompletionChunk = {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    delta?: { role?: string; content?: string | null };
    finish_reason?: string | null;
  }>;
  error?: { message?: string; type?: string; code?: string };
};

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;

  constructor(message: string, status: number, code: ApiErrorCode) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type MeStatus = {
  apiKey: { id: string; name: string };
  usage: {
    cost: {
      period: string;
      currency: string;
      usedUsd: number;
      limitUsd: number | null;
      remainingUsd: number | null;
      usedPercent: number | null;
      warningThreshold: number | null;
      resetAt: string | null;
      periodStartAt: string | null;
    };
    tokens: {
      periodStartAt: string | null;
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheCreationTokens: number;
      reasoningTokens: number;
      totalTokens: number;
    };
  };
};

export type ModelPricing = {
  input?: number;
  output?: number;
  cached?: number;
  cache_creation?: number;
  unit?: "usd_per_1m_tokens";
};

export type ModelItem = {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
  root?: string;
  parent?: string | null;
  context_length?: number;
  pricing?: ModelPricing | null;
};

export type ModelsResponse = {
  object: string;
  data: ModelItem[];
};

export type CallLogSpend = {
  totalUsd: number | null;
  currency: "USD";
  estimate: boolean;
  rates: {
    input: number;
    output: number;
    cached: number;
    cache_creation: number;
    reasoning: number;
  } | null;
  tokens: {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
    reasoning: number;
  };
  formula: string;
};

export type CallLog = {
  id: string;
  timestamp: string | null;
  method: string | null;
  path: string | null;
  status: number | null;
  model: string | null;
  requestedModel: string | null;
  comboName?: string | null;
  provider: string | null;
  duration: number | null;
  tokens: {
    in: number;
    out: number;
    cacheRead?: number | null;
    cacheWrite?: number | null;
    reasoning?: number | null;
  };
  error: string | null;
  correlationId: string | null;
  spend?: CallLogSpend | null;
};

export type LogsResponse = {
  data: CallLog[];
  total: number;
  limit: number;
  offset: number;
};

export type LogsQuery = {
  limit?: number;
  offset?: number;
  status?: "" | "ok" | "error";
  model?: string;
  search?: string;
};

export type PaymentPackage = {
  id: string;
  label: string;
  usdAmount: number;
  amountIdr: number;
};

export type PaymentsConfig = {
  currency: string;
  idrPerUsd: number;
  rateLabel: string;
  packages: PaymentPackage[];
  configured: boolean;
  mockEnabled: boolean;
  defaults: {
    successReturnUrl: string | null;
    cancelReturnUrl: string | null;
  };
  lifetimeQuota: {
    enabled: boolean;
    limitUsd: number | null;
    spentUsd: number;
    remainingUsd: number | null;
  } | null;
};

export type PaymentCreateResponse = {
  id: string;
  orderId: string;
  amountIdr: number;
  usdCredit: number;
  idrPerUsd: number;
  paymentLinkUrl: string | null;
  status: string;
  expiresAt: string | null;
  sumopodPaymentId: string;
  mock?: boolean;
};

export type PaymentHistoryItem = {
  id: string;
  orderId: string;
  amountIdr: number;
  usdCredit: number;
  idrPerUsd: number;
  status: string;
  credited: boolean;
  paymentLinkUrl: string | null;
  paymentMethod: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type PaymentsListResponse = {
  data: PaymentHistoryItem[];
};
