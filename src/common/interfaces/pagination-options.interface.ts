/**
 * Base interface for WorkOS API pagination parameters
 */
export interface PaginationOptions {
  limit?: number;
  before?: string;
  after?: string;
}
