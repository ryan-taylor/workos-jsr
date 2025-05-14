/**
 * Options for creating a new audit log event.
 *
 * @example
 * ```ts
 * const eventOptions: CreateEventOptions = {
 *   organization_id: 'org_123',
 *   action: 'document.download',
 *   actor: {
 *     id: 'user_123',
 *     type: 'user',
 *     name: 'John Doe'
 *   },
 *   target: {
 *     id: 'doc_456',
 *     type: 'document',
 *     name: 'Confidential.pdf'
 *   }
 * };
 * ```
 */
export interface CreateEventOptions {
  /** The ID of the organization this audit log belongs to */
  organization_id: string;

  /** The action that was performed (e.g., 'user.login', 'document.view') */
  action: string;

  /**
   * Information about who performed the action
   * Should typically include at least 'id', 'type', and 'name' fields
   */
  actor: Record<string, unknown>;

  /**
   * Information about the object the action was performed on
   * Should typically include at least 'id', 'type', and 'name' fields
   */
  target: Record<string, unknown>;

  /**
   * Optional contextual information about where/how the action occurred
   * Can include IP addresses, user agents, location data, etc.
   */
  context?: Record<string, unknown>;

  /**
   * Optional ISO timestamp when the event occurred
   * If not provided, defaults to the current time
   */
  occurred_at?: string;

  /** Optional additional custom metadata to associate with the event */
  metadata?: Record<string, unknown>;
}
