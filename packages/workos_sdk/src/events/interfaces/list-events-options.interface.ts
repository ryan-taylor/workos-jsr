/**
 * Options for retrieving a list of WorkOS Events.
 * These options control time range, filtering, and pagination of event results.
 */
export interface EventsListOptions {
  /** ISO timestamp to start the time range filter from (inclusive) */
  range_start?: string;
  /** ISO timestamp to end the time range filter at (inclusive) */
  range_end?: string;
  /** Maximum number of events to return */
  limit?: number;
  /** Filter to only include events matching these event names */
  events?: string[];
}
