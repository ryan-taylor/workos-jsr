import type {
  PolicyContext,
  Warrant,
  WarrantResponse,
} from "./warrant.interface.ts";
import type { PaginationOptions } from "../../common/interfaces.ts";
import type { GetOptions } from "../../common/interfaces.ts";

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
  meta?: { [key: string]: unknown };
}

export interface QueryResultResponse {
  resource_type: string;
  resource_id: string;
  relation: string;
  warrant: WarrantResponse;
  is_implicit: boolean;
  meta?: Record<string, unknown>;
}

export type QueryRequestOptions = Pick<GetOptions, "warrantToken">;
