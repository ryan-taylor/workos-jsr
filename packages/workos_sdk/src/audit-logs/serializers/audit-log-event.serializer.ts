import type { AuditLogEvent } from "workos/audit-logs/interfaces/index.ts";

export function deserializeAuditLogEvent(item: unknown): AuditLogEvent {
  const data = item as Record<string, unknown>;
  return {
    id: data.id as string,
    organization_id: data.organization_id as string,
    action: data.action as string,
    actor: data.actor as Record<string, unknown>,
    target: data.target as Record<string, unknown>,
    context: data.context as Record<string, unknown>,
    occurred_at: data.occurred_at as string,
    metadata: data.metadata as Record<string, unknown>,
  };
}
