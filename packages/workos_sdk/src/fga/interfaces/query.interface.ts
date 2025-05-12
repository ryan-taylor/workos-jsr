import type { Warrant } from "./warrant.interface.ts";

export interface QueryOptions {
  q: string;
  limit?: number;
  after?: string;
  order?: "asc" | "desc";
}

export interface SerializedQueryOptions {
  q: string;
  limit?: number;
  after?: string;
  order?: "asc" | "desc";
}

export interface QueryRequestOptions {
  warrantToken?: string;
}

export interface QueryResult {
  resourceType: string;
  resourceId: string;
  warrant: Warrant;
  isImplicit: boolean;
}

export interface SerializedQueryResultWarrant {
  resource_type: string;
  resource_id: string;
  relation: string;
  subject: {
    resource_type: string;
    resource_id: string;
    relation?: string;
  };
  policy?: string;
}

export interface QueryResultResponse {
  resource_type: string;
  resource_id: string;
  warrant: SerializedQueryResultWarrant;
  is_implicit: boolean;
}