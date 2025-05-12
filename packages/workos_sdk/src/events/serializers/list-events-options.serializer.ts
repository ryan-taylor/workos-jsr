import type { EventsListOptions } from "../interfaces";

export function serializeListEventsOptions(
  options: EventsListOptions,
): Record<string, string | number | boolean | undefined> {
  return {
    range_start: options.range_start,
    range_end: options.range_end,
    limit: options.limit,
    events: options.events?.join(","),
  };
}
