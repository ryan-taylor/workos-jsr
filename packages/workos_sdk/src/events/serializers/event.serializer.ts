import type { Event } from "../interfaces";

export function deserializeEvent(data: Record<string, unknown>): Event {
  return {
    id: data.id as string,
    event: data.event as string,
    data: data.data as Record<string, unknown>,
    created_at: data.created_at as string,
  };
}
