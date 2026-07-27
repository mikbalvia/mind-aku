/** Mask a secret for display: keep last 4 characters visible. */
export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "••••••••";
  const visible = trimmed.slice(-4);
  return `••••••••••••${visible}`;
}
