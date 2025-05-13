import type { Event } from "workos/events/interfaces.ts";

export function deserializeEvent(data: unknown): Event {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    event: record.event as string,
    data: record.data as Record<string, unknown>,
    created_at: record.created_at as string,
  };
}
