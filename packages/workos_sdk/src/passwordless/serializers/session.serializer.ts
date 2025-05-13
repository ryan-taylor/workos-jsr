import type { PasswordlessSession } from "workos/passwordless/interfaces/index.ts";

export function deserializeSession(
  data: Record<string, unknown>,
): PasswordlessSession {
  return {
    id: data.id as string,
    email: data.email as string,
    expires_at: data.expires_at as string,
    link: data.link as string,
  };
}
