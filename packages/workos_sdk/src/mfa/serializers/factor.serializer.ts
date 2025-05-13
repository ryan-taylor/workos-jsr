import type { Factor } from "workos/mfa/interfaces/index.ts";

export function deserializeFactor(item: unknown): Factor {
  const data = item as Record<string, unknown>;
  return {
    id: data.id as string,
    type: data.type as "totp" | "sms",
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
