import type { PostOptions } from "../../common/interfaces.ts";
import type { MetadataMap } from "../../common/interfaces/metadata.interface.ts";

export type AuditLogSchemaMetadata =
  | Record<string, { type: "string" | "boolean" | "number" }>
  | undefined;

export interface AuditLogSchema {
  object: "audit_log_schema";
  version: number;
  targets: AuditLogTargetSchema[];
  actor: AuditLogActorSchema;
  metadata: MetadataMap | undefined;
  createdAt: string;
}

export interface AuditLogActorSchema {
  metadata: MetadataMap;
}

export interface AuditLogTargetSchema {
  type: string;
  metadata?: MetadataMap | undefined;
}

export interface CreateAuditLogSchemaOptions {
  action: string;
  targets: AuditLogTargetSchema[];
  actor?: AuditLogActorSchema;
  metadata?: MetadataMap;
}

interface SerializedAuditLogTargetSchema {
  type: string;
  metadata?: {
    type: "object";
    properties: AuditLogSchemaMetadata;
  };
}

export interface SerializedCreateAuditLogSchemaOptions {
  targets: SerializedAuditLogTargetSchema[];
  actor?: {
    metadata: {
      type: "object";
      properties: AuditLogSchemaMetadata;
    };
  };
  metadata?: {
    type: "object";
    properties: AuditLogSchemaMetadata;
  };
}

export interface CreateAuditLogSchemaResponse {
  object: "audit_log_schema";
  version: number;
  targets: SerializedAuditLogTargetSchema[];
  actor: {
    metadata: {
      type: "object";
      properties: AuditLogSchemaMetadata;
    };
  };
  metadata?: {
    type: "object";
    properties: AuditLogSchemaMetadata;
  };
  created_at: string;
}

export type CreateAuditLogSchemaRequestOptions = Pick<
  PostOptions,
  "idempotencyKey"
>;
