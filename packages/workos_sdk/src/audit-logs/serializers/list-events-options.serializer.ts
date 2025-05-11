import type { ListEventsOptions } from "../interfaces/index.ts";

export function serializeListEventsOptions(
  options: ListEventsOptions,
): Record<string, unknown> {
  return {
    organization_id: options.organization_id,
    range_start: options.range_start,
    range_end: options.range_end,
    limit: options.limit,
    order: options.order,
    actions: options.actions?.join(","),
    actors: options.actors?.join(","),
    targets: options.targets?.join(","),
  };
}
