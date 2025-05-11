import type { WorkOS } from "../workos.ts";
import type { ListEventOptions } from "./interfaces.ts";
import { deserializeEvent, deserializeList } from "../common/serializers.ts";
import { serializeListEventOptions } from "./serializers.ts";
import type {
  Event,
  EventResponse,
  List,
  ListResponse,
} from "../common/interfaces.ts";

export class Events {
  constructor(private readonly workos: WorkOS) {}

  async listEvents(options: ListEventOptions): Promise<List<Event>> {
    const { data } = await this.workos.get<ListResponse<EventResponse>>(
      `/events`,
      {
        query: options ? serializeListEventOptions(options) : undefined,
      },
    );

    return deserializeList(data, deserializeEvent);
  }
}
