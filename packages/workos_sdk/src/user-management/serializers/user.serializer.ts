import type { User } from "../interfaces/index.ts";

export function deserializeUser(item: unknown): User {
  const data = item as Record<string, unknown>;
  return {
    id: data.id as string,
    email: data.email as string,
    first_name: data.first_name as string | undefined,
    last_name: data.last_name as string | undefined,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
