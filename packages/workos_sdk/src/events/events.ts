import { deserializeEvent } from "./serializers/event.serializer.ts";
import { serializeListEventsOptions } from "./serializers/list-events-options.serializer.ts";
import type { Event, ListEventsOptions } from "./interfaces";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";

export class Events {
  constructor(private apiKey: string) {}

  async listEvents(options: ListEventsOptions = {}): Promise<Event[]> {
    return await fetchAndDeserialize({
      path: "/events",
      deserializer: deserializeEvent,
      apiKey: this.apiKey,
      queryParams: serializeListEventsOptions(options),
    });
  }
}
