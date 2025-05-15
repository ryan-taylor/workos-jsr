import type { List, PaginationOptions } from "../interfaces.ts";

export class AutoPaginatable<T> {
  readonly options: PaginationOptions;

  constructor(
    private list: List<T>,
    private apiCall: (params: PaginationOptions) => Promise<List<T>>,
    options?: PaginationOptions,
  ) {
    this.options = {
      ...options,
    };
  }

  get data(): T[] {
    return this.list.data;
  }

  get listMetadata() {
    return this.list.listMetadata;
  }

  private async *generatePages(params: PaginationOptions): AsyncGenerator<T[]> {
    const result = await this.apiCall({
      ...this.options,
      limit: 100,
      after: params.after,
    });

    yield result.data;

    if (result.listMetadata && result.listMetadata.after) {
      // Delay of 4rps to respect list users rate limits
      await new Promise((resolve) => setTimeout(resolve, 250));
      yield* this.generatePages({ after: result.listMetadata.after });
    }
  }

  /**
   * Automatically paginates over the list of results, returning the complete data set.
   * Returns the first result if `options.limit` is passed to the first request.
   */
  async autoPagination(): Promise<T[]> {
    if (this.options.limit) {
      return this.data;
    }

    const results: T[] = [];

    for await (
      const page of this.generatePages({
        after: this.options.after,
      })
    ) {
      results.push(...page);
    }

    return results;
  }
}

export class PageIterator<T> {
  private hasNextPage = true;
  private options: PaginationOptions;

  constructor(
    private readonly fetchPage: (
      options: PaginationOptions,
    ) => Promise<List<T>>,
    private readonly list: List<T>,
    options: PaginationOptions = {},
  ) {
    this.options = { ...options };
  }

  get listMetadata() {
    return this.list.listMetadata;
  }

  next(): List<T> {
    return this.list;
  }

  async *generatePages(
    options: PaginationOptions = {},
  ): AsyncGenerator<List<T>, void, unknown> {
    let result = this.list;
    yield result;

    while (result.listMetadata && result.listMetadata.after) {
      // eslint-disable-next-line no-await-in-loop
      result = await this.fetchPage({
        ...options,
        after: result.listMetadata.after,
      });
      yield result;
    }
  }
}
