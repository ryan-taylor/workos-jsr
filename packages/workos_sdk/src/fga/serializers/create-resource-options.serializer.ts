import type {
  CreateResourceOptions,
  SerializedCreateResourceOptions,
} from "../interfaces/index.ts";
import { isResourceInterface } from "../utils/interface-check.ts";

/**
 * Serializes create resource options for the API
 * @param options The create resource options
 * @returns The serialized create resource options
 */
export const serializeCreateResourceOptions = (
  options: CreateResourceOptions,
): SerializedCreateResourceOptions => {
  const { resource, meta } = options;
  
  const resourceType = isResourceInterface(resource)
    ? resource.getResourceType()
    : resource.resourceType;
  
  const resourceId = isResourceInterface(resource)
    ? resource.getResourceId()
    : resource.resourceId;

  return {
    resource_type: resourceType,
    resource_id: resourceId,
    meta,
  };
};