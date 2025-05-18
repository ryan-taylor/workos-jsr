import type {
  DeleteResourceOptions,
  SerializedDeleteResourceOptions,
} from "../interfaces/index.ts";
import { isResourceInterface } from "../utils/interface-check.ts";

/**
 * Serializes delete resource options for the API
 * @param options The delete resource options
 * @returns The serialized delete resource options
 */
export const serializeDeleteResourceOptions = (
  options: DeleteResourceOptions,
): SerializedDeleteResourceOptions => {
  const resourceType = isResourceInterface(options)
    ? options.getResourceType()
    : options.resourceType;

  const resourceId = isResourceInterface(options)
    ? options.getResourceId()
    : options.resourceId;

  // For delete operations, resourceId is required
  if (!resourceId) {
    throw new Error("Resource ID is required for delete operations");
  }

  return {
    resource_type: resourceType,
    resource_id: resourceId,
  };
};
