export interface AuditLogEvent {
  id: string;
  organization_id: string;
  action: string;
  actor: Record<string, unknown>;
  target: Record<string, unknown>;
  context: Record<string, unknown>;
  occurred_at: string;
  metadata: Record<string, unknown>;
}
