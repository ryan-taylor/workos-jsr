import type { CreateSessionOptions } from "workos/passwordless/interfaces/index.ts";

export function serializeCreateSessionOptions(
  options: CreateSessionOptions,
): Record<string, unknown> {
  return {
    email: options.email,
    type: options.type,
  };
}
