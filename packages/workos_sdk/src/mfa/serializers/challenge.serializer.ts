import type { Challenge } from "../interfaces/index.ts";

export function deserializeChallenge(item: unknown): Challenge {
  const data = item as Record<string, unknown>;
  return {
    id: data.id as string,
    factor_id: data.factor_id as string,
    expires_at: data.expires_at as string,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
