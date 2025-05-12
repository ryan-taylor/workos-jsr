import type {
  BatchWriteResourcesResponse,
  Resource,
  ResourceResponse,
} from "../interfaces/index.ts";

/**
 * Deserializes a resource response from the API to a Resource object
 * @param response The resource response from the API
 * @returns The deserialized Resource object
 */
export const deserializeResource = (response: ResourceResponse): Resource => ({
  resourceType: response.resource_type,
  resourceId: response.resource_id,
  meta: response.meta,
});

/**
 * Deserializes a batch write resources response from the API
 * @param response The batch write resources response from the API
 * @returns An array of deserialized Resource objects
 */
export const deserializeBatchWriteResourcesResponse = (
  response: BatchWriteResourcesResponse,
): Resource[] => {
  return response.data.map((resource) => deserializeResource(resource));
};