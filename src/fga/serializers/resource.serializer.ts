import type {
  BatchWriteResourcesResponse,
  Resource,
  ResourceResponse,
} from "../interfaces.ts";

export const deserializeResource = (response: ResourceResponse): Resource => ({
  resourceType: response.resource_type,
  resourceId: response.resource_id,
  meta: response.meta,
});

export const deserializeBatchWriteResourcesResponse = (
  response: BatchWriteResourcesResponse,
): Resource[] => {
  return response.data.map((resource) => deserializeResource(resource));
};
