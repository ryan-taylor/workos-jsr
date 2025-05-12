import { deserializeEvent } from "./serializers/event.serializer.ts";
import { serializeListEventsOptions } from "./serializers/list-events-options.serializer.ts";
import type { Event, EventsListOptions } from "./interfaces";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import { List } from "../common/interfaces/list.interface.ts";
import { deserializeList } from "../common/serializers/list.serializer.ts";

export class Events {
  constructor(private apiKey: string) {}

  async listEvents(options: EventsListOptions = {}): Promise<Event[]> {
    return await fetchAndDeserialize({
      path: "/events",
      deserializer: deserializeEvent,
      apiKey: this.apiKey,
      queryParams: serializeListEventsOptions(options),
    });
  }
}
