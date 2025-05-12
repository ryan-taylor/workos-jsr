import { deserializeEvent } from "./serializers/event.serializer.ts";
import { serializeListEventsOptions } from "./serializers/list-events-options.serializer.ts";
import type { Event, EventsListOptions } from "./interfaces.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { List } from "../common/interfaces.ts";
import type { WorkOS } from "../workos.ts";

export class Events {
  constructor(private workos: WorkOS) {}

  async listEvents(options: EventsListOptions = {}): Promise<Event[]> {
    const result = await fetchAndDeserialize<Record<string, unknown>, Event>(
      {
        workos: this.workos,
        path: "/events",
        deserializer: deserializeEvent,
        queryParams: serializeListEventsOptions(options),
      }
    );
    
    // Handle the case where result might be a List<Event>
    if (result && typeof result === 'object' && 'data' in result) {
      // It's a List, return data array
      return (result as List<Event>).data;
    }
    
    // Convert single item to array if needed
    return Array.isArray(result) ? result : [result];
  }
}
