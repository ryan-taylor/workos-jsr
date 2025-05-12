import { deserializeAuditLogEvent } from "./serializers/audit-log-event.serializer.ts";
import { serializeListEventsOptions } from "./serializers/list-events-options.serializer.ts";
import type {
  AuditLogEvent,
  CreateEventOptions,
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
    const result = await fetchAndDeserialize<Record<string, unknown>, AuditLogEvent>(
      this.workos,
      "/audit_logs",
      deserializeAuditLogEvent,
      serializeListEventsOptions(options),
    );
    return result as List<AuditLogEvent>;
  }
}
