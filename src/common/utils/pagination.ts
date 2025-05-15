/**
 * Pagination utilities for WorkOS API responses
 */

export interface ListMetadata {
  before: string | null;
  after: string | null;
}

/**
 * Generic paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  list_metadata: ListMetadata;
}

/**
 * Standard pagination parameters supported by WorkOS API endpoints
 */
export interface PaginationParams {
  limit?: number;
  before?: string;
  after?: string;
  order?: "asc" | "desc";
}
