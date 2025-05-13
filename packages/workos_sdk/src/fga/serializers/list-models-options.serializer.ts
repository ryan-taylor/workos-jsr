import type { ListModelsOptions } from "workos/fga/interfaces/index.ts";

export function serializeListModelsOptions(
  options: ListModelsOptions,
): Record<string, unknown> {
  return {
    organization_id: options.organization_id,
    limit: options.limit,
    before: options.before,
    after: options.after,
  };
}
