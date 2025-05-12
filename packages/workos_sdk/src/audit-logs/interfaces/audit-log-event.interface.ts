/**
 * Represents an audit log event in WorkOS.
 * An audit log event captures an action performed by an actor on a target within an organization.
 */
export interface AuditLogEvent {
  /** Unique identifier for the audit log event */
  id: string;
  
  /** ID of the organization this audit log belongs to */
  organization_id: string;
  
  /** The action that was performed (e.g., "user.login", "document.view") */
  action: string;
  
  /** Information about who performed the action */
  actor: Record<string, unknown>;
  
  /** Information about the object the action was performed on */
  target: Record<string, unknown>;
  
  /** Contextual information about the environment where the action occurred */
  context: Record<string, unknown>;
  
  /** ISO timestamp when the event occurred */
  occurred_at: string;
  
  /** Additional custom metadata associated with the event */
  metadata: Record<string, unknown>;
}
