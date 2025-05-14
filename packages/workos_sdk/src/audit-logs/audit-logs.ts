import { deserializeAuditLogEvent } from "./serializers/audit-log-event.serializer.ts";
import { serializeListEventsOptions } from "./serializers/list-events-options.serializer.ts";
import type {
  AuditLogEvent,
  AuditLogListEventsOptions,
  CreateEventOptions,
} from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";
import type { List } from "../common/interfaces.ts";

/**
 * Service for working with WorkOS Audit Logs.
 *
 * The Audit Logs API allows you to create and retrieve audit log events for your organization.
 * Audit logs capture key actions performed by users within your application.
 *
 * @example
 * ```ts
 * // Create a new audit log event
 * const event = await workos.auditLogs.createEvent({
 *   organization_id: 'org_123',
 *   action: 'document.view',
 *   actor: {
 *     id: 'user_123',
 *     type: 'user'
 *   },
 *   target: {
 *     id: 'doc_456',
 *     type: 'document'
 *   },
 *   context: {
 *     location: '1.2.3.4'
 *   }
 * });
 * ```
 */
export class AuditLogs {
  constructor(private workos: WorkOS) {}

  /**
   * Creates a new audit log event.
   *
   * @param options - Configuration options for creating an audit log event
   * @returns Promise resolving to the created audit log event
   *
   * @example
   * ```ts
   * const event = await workos.auditLogs.createEvent({
   *   organization_id: 'org_123',
   *   action: 'document.view',
   *   actor: {
   *     id: 'user_123',
   *     type: 'user'
   *   },
   *   target: {
   *     id: 'doc_456',
   *     type: 'document'
   *   },
   *   occurred_at: new Date().toISOString()
   * });
   * ```
   */
  async createEvent(options: CreateEventOptions): Promise<AuditLogEvent> {
    const response = await this.workos.post<{ data: AuditLogEvent }>(
      "/audit_logs",
      { body: options },
    );
    return deserializeAuditLogEvent(response.data);
  }

  /**
   * Lists audit log events with optional filtering.
   *
   * @param options - Configuration options for listing audit log events
   * @returns Promise resolving to a paginated list of audit log events
   *
   * @example
   * ```ts
   * const events = await workos.auditLogs.listEvents({
   *   organization_id: 'org_123',
   *   limit: 10,
   *   action: 'document.view'
   * });
   *
   * // Iterate through events
   * for (const event of events.data) {
   *   console.log(`${event.actor.name} ${event.action} at ${event.occurred_at}`);
   * }
   * ```
   */
  async listEvents(
    options: AuditLogListEventsOptions,
  ): Promise<List<AuditLogEvent>> {
    const result = await fetchAndDeserialize<
      Record<string, unknown>,
      AuditLogEvent
    >(
      this.workos,
      "/audit_logs",
      deserializeAuditLogEvent,
      serializeListEventsOptions(options),
    );
    return result as List<AuditLogEvent>;
  }
}
