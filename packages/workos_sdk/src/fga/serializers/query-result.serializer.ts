import type {
  QueryResult,
  QueryResultResponse,
} from "../interfaces/index.ts";
import { deserializeWarrant } from "./warrant.serializer.ts";

/**
 * Deserializes a query result response from the API
 * @param result The query result response from the API
 * @returns The deserialized QueryResult object
 */
export const deserializeQueryResult = (result: QueryResultResponse): QueryResult => ({
  resourceType: result.resource_type,
  resourceId: result.resource_id,
  warrant: deserializeWarrant(result.warrant),
  isImplicit: result.is_implicit,
});