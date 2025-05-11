import type { WebhookEvent } from "../interfaces/index.ts";

export function deserializeWebhookEvent(
  data: Record<string, unknown>,
): WebhookEvent {
  return {
    id: data.id as string,
    event: data.event as string,
    data: data.data as Record<string, unknown>,
    created_at: data.created_at as string,
  };
}
