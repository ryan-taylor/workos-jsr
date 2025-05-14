import { deserializeEvent } from "./serializers/event.serializer.ts";
import { serializeListEventsOptions } from "./serializers/list-events-options.serializer.ts";
import type { Event, EventsListOptions } from "./interfaces.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { List } from "../common/interfaces.ts";
import type { WorkOS } from "../workos.ts";

/**
 * Service for retrieving WorkOS Events.
 *
 * The Events API provides access to audit events and other system-generated events
 * that occur within your organization.
 *
 * @example
 * ```ts
 * // Retrieve the latest events
 * const events = await workos.events.listEvents({ limit: 10 });
 * events.forEach(e => console.log(`${e.event} at ${e.created_at}`));
 * ```
 */
export class Events {
  /**
   * @param workos - The main WorkOS client instance
   */
  constructor(private workos: WorkOS) {}

  /**
   * Lists events with optional filtering and pagination.
   *
   * @param options - Configuration options for listing events
   * @returns Promise resolving to an array of Event objects
   *
   * @example
   * ```ts
   * const events = await workos.events.listEvents({
   *   range_start: '2023-01-01T00:00:00Z',
   *   limit: 5,
   *   events: ['user.login']
   * });
   * ```
   */
  async listEvents(options: EventsListOptions = {}): Promise<Event[]> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Event>(
      {
        workos: this.workos,
        path: "/events",
        deserializer: deserializeEvent,
        queryParams: serializeListEventsOptions(options),
      },
    );

    // Handle the case where result might be a List<Event>
    if (result && typeof result === "object" && "data" in result) {
      // It's a List, return data array
      return (result as List<Event>).data;
    }

    // Convert single item to array if needed
    return Array.isArray(result) ? result : [result];
  }
}
