/** Internal reseller aliases — hide from customer-facing FE lists. */
export function isResellModelId(id: string | null | undefined): boolean {
  if (!id) return false;
  return id.toLowerCase().includes("resell");
}

export function excludeResellModels<T extends { id: string }>(models: T[]): T[] {
  return models.filter((model) => !isResellModelId(model.id));
}

export function excludeResellModelIds(ids: string[]): string[] {
  return ids.filter((id) => !isResellModelId(id));
}
