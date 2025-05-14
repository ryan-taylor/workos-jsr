import type { GenerateLinkOptions } from "../interfaces.ts";

export function serializeGenerateLinkOptions(
  options: GenerateLinkOptions,
): Record<string, unknown> {
  return {
    organization: options.organization,
    intent: options.intent,
    return_url: options.return_url,
  };
}
