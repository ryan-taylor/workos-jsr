import type { Session } from "../interfaces/index.ts";

export function deserializeSession(item: unknown): Session {
  const data = item as Record<string, unknown>;
  return {
    id: data.id as string,
    user_id: data.user_id as string,
    expires_at: data.expires_at as string,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
