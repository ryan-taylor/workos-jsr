/**
 * Base interface for WorkOS API pagination parameters
 *
 * This is a foundational interface used throughout the API for pagination controls.
 * It extends Record<string, unknown> to allow for additional properties when needed
 * while maintaining type safety.
 */
export interface PaginationOptions extends Record<string, unknown> {
  limit?: number;
  before?: string;
  after?: string;
}
