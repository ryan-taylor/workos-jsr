/**
 * Options for retrieving and filtering audit log events.
 * 
 * @example
 * ```ts
 * // Get all document.view events from the last 24 hours
 * const yesterday = new Date();
 * yesterday.setDate(yesterday.getDate() - 1);
 * 
 * const options: AuditLogListEventsOptions = {
 *   organization_id: 'org_123',
 *   range_start: yesterday.toISOString(),
 *   actions: ['document.view'],
 *   limit: 100
 * };
 * ```
 */
export interface AuditLogListEventsOptions {
  /** The ID of the organization to retrieve audit logs for */
  organization_id: string;
  
  /** 
   * ISO timestamp to start the time range filter from (inclusive)
   * Only events that occurred at or after this time will be returned
   */
  range_start?: string;
  
  /**
   * ISO timestamp to end the time range filter at (inclusive)
   * Only events that occurred at or before this time will be returned
   */
  range_end?: string;
  
  /** Maximum number of events to return in a single page (default and max set by API) */
  limit?: number;
  
  /** Sort order for the events (default: "desc" - newest first) */
  order?: "desc" | "asc";
  
  /** Filter to only include events with these specific action types */
  actions?: string[];
  
  /** Filter to only include events with actors matching these IDs */
  actors?: string[];
  
  /** Filter to only include events with targets matching these IDs */
  targets?: string[];
}
