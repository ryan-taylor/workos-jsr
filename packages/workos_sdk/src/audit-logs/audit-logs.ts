import { deserializeAuditLogEvent } from "./serializers/audit-log-event.serializer.ts";
import { serializeListEventsOptions } from "./serializers/list-events-options.serializer.ts";
import type {
  AuditLogEvent,
  CreateEventOptions,
  ListEventsOptions,
  AuditLogCreateEventOptions,
  AuditLogListEventsOptions,
} from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";
import type { List } from "../common/interfaces.ts";

export class AuditLogs {
  constructor(private workos: WorkOS) {}

  async createEvent(options: CreateEventOptions): Promise<AuditLogEvent> {
    const response = await this.workos.post<{ data: AuditLogEvent }>(
      "/audit_logs",
      { body: options },
    );
    return deserializeAuditLogEvent(response.data);
  }

  async listEvents(options: AuditLogListEventsOptions): Promise<List<AuditLogEvent>> {
    return await fetchAndDeserialize(
      this.workos,
      "/audit_logs",
      deserializeAuditLogEvent,
      serializeListEventsOptions(options),
    );
  }
}
