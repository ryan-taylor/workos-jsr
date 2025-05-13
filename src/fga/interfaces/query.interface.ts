import type {
  PolicyContext,
  Warrant,
  WarrantResponse,
} from "./warrant.interface.ts.ts";
import type { PaginationOptions } from "../../common/interfaces/pagination-options.interface.ts.ts";
import type { GetOptions } from "../../common/interfaces.ts.ts";

export interface QueryOptions extends PaginationOptions {
  q: string;
  context?: PolicyContext;
}

export interface SerializedQueryOptions extends PaginationOptions {
  q: string;
  context?: string;
}

export interface QueryResult {
  resourceType: string;
  resourceId: string;
  relation: string;
  warrant: Warrant;
  isImplicit: boolean;
  meta?: { [key: string]: any };
}

export interface QueryResultResponse {
  resource_type: string;
  resource_id: string;
  relation: string;
  warrant: WarrantResponse;
  is_implicit: boolean;
  meta?: Record<string, any>;
}

export type QueryRequestOptions = Pick<GetOptions, "warrantToken">;
