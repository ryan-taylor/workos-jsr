import type { DeleteResourceOptions, SerializedDeleteResourceOptions } from '../interfaces.ts';
import { isResourceInterface } from '../utils/interface-check.ts';

export const serializeDeleteResourceOptions = (
  options: DeleteResourceOptions,
): SerializedDeleteResourceOptions => ({
  resource_type: isResourceInterface(options) ? options.getResourceType() : options.resourceType,
  resource_id: isResourceInterface(options) ? options.getResourceId() : options.resourceId ? options.resourceId : '',
});
