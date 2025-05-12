/**
 * Represents a system event in WorkOS.
 * Events capture significant actions or occurrences within your organization.
 */
export interface Event {
  /** Unique identifier for the event */
  id: string;
  /** Name of the event (e.g., 'user.login', 'provider.provisioned') */
  event: string;
  /** Data payload associated with the event */
  data: Record<string, unknown>;
  /** ISO timestamp when the event was created */
  created_at: string;
}
