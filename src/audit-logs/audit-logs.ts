import type { WorkOS } from "@ryantaylor/workos";
import type {
  CreateAuditLogEventOptions,
  CreateAuditLogEventRequestOptions,
} from "$sdk/audit-logs/interfaces";
import type { AuditLogExportOptions } from "$sdk/audit-logs/interfaces/audit-log-export-options.interface";
import type {
  AuditLogExport,
  AuditLogExportResponse,
} from "$sdk/audit-logs/interfaces/audit-log-export.interface";
import type {
  AuditLogSchema,
  CreateAuditLogSchemaOptions,
  CreateAuditLogSchemaRequestOptions,
  CreateAuditLogSchemaResponse,
} from "$sdk/audit-logs/interfaces/create-audit-log-schema-options.interface";
import {
  deserializeAuditLogExport,
  deserializeAuditLogSchema,
  serializeAuditLogExportOptions,
  serializeCreateAuditLogEventOptions,
  serializeCreateAuditLogSchemaOptions,
} from "$sdk/audit-logs/serializers";

export class AuditLogs {
  constructor(private readonly workos: WorkOS) {}

  createEvent(
    organization: string,
    event: CreateAuditLogEventOptions,
    options: CreateAuditLogEventRequestOptions = {},
  ): Promise<void> {
    return this.workos.post(
      "/audit_logs/events",
      {
        event: serializeCreateAuditLogEventOptions(event),
        organization_id: organization,
      },
      options,
    );
  }

  async createExport(options: AuditLogExportOptions): Promise<AuditLogExport> {
    const { data } = await this.workos.post<AuditLogExportResponse>(
      "/audit_logs/exports",
      serializeAuditLogExportOptions(options),
    );

    return deserializeAuditLogExport(data);
  }

  async getExport(auditLogExportId: string): Promise<AuditLogExport> {
    const { data } = await this.workos.get<AuditLogExportResponse>(
      `/audit_logs/exports/${auditLogExportId}`,
    );

    return deserializeAuditLogExport(data);
  }

  createSchema(
    schema: CreateAuditLogSchemaOptions,
    options: CreateAuditLogSchemaRequestOptions = {},
  ): Promise<AuditLogSchema> {
    return this.workos.post<CreateAuditLogSchemaResponse>(
      `/audit_logs/actions/${schema.action}/schemas`,
      serializeCreateAuditLogSchemaOptions(schema),
      options,
    ).then(({ data }) => deserializeAuditLogSchema(data));
  }
}
