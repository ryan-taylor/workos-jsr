import { deserializeAuditLogEvent } from "./serializers/audit-log-event.serializer.ts";
import { serializeListEventsOptions } from "./serializers/list-events-options.serializer.ts";
import type {
  AuditLogEvent,
  AuditLogExport,
  AuditLogListEventsOptions,
  AuditLogSchema,
  CreateEventOptions as _CreateEventOptions,
  CreateExportOptions,
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
   * @param organizationId - The ID of the organization
   * @param event - The audit log event data
   * @param options - Optional parameters
   * @returns Promise resolving to the created audit log event
   *
   * @example
   * ```ts
   * const event = await workos.auditLogs.createEvent('org_123', {
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
  async createEvent(
    organizationId: string,
    event: Record<string, unknown>,
    options: { idempotencyKey?: string } = {},
  ): Promise<AuditLogEvent> {
    const payload = {
      organization_id: organizationId,
      ...event,
    };

    const response = await this.workos.post<{ data: AuditLogEvent }>(
      "/audit_logs/events",
      payload,
      options,
    );
    return deserializeAuditLogEvent(response.data);
  }

  /**
   * Creates an audit log export.
   *
   * @param options - Configuration options for creating an export
   * @returns Promise resolving to the created export
   */
  async createExport(options: CreateExportOptions): Promise<AuditLogExport> {
    const payload = {
      organization_id: options.organizationId,
      range_start: options.rangeStart,
      range_end: options.rangeEnd,
    };

    const response = await this.workos.post<{ data: AuditLogExport }>(
      "/audit_logs/exports",
      payload,
    );
    return response.data.data;
  }

  /**
   * Gets an audit log export by ID.
   *
   * @param exportId - The ID of the export to retrieve
   * @returns Promise resolving to the export
   */
  async getExport(exportId: string): Promise<AuditLogExport> {
    const response = await this.workos.get<{ data: AuditLogExport }>(
      `/audit_logs/exports/${exportId}`,
    );
    return response.data.data;
  }

  /**
   * Creates an audit log schema.
   *
   * @param schema - The schema definition
   * @param options - Optional parameters
   * @returns Promise resolving to the created schema
   */
  async createSchema(
    schema: Record<string, unknown>,
    options: { idempotencyKey?: string } = {},
  ): Promise<AuditLogSchema> {
    const response = await this.workos.post<{ data: AuditLogSchema }>(
      `/audit_logs/actions/${schema.action}/schemas`,
      schema,
      options,
    );
    return response.data.data;
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
