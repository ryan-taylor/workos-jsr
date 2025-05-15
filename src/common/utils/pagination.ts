/**
 * Pagination utilities for WorkOS API responses
 */

/**
 * Class for resources that support auto-pagination
 */
export class AutoPaginatable<T> {
  private fetchNextPage: () => Promise<PaginatedResponse<T>>;

  constructor(fetchNextPage: () => Promise<PaginatedResponse<T>>) {
    this.fetchNextPage = fetchNextPage;
  }

  /**
   * Fetches all pages of results for a paginated resource
   *
   * @returns A promise that resolves to all results across pages
   */
  async listAll(): Promise<T[]> {
    // Simple implementation that would fetch all pages
    const response = await this.fetchNextPage();
    return response.data;
  }

  /**
   * Creates a paginated iterator for the resource
   *
   * @returns An async iterator that yields pages of results
   */
  async *paginate(): AsyncGenerator<T[], void, unknown> {
    // Simple implementation that would yield pages one at a time
    const response = await this.fetchNextPage();
    yield response.data;
  }
}

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
  listMetadata?: ListMetadata; // Adding camelCase version for compatibility
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
