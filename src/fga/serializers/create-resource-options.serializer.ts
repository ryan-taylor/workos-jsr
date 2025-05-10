import {
  CreateResourceOptions,
  SerializedCreateResourceOptions,
} from '../interfaces.ts';
import { isResourceInterface } from '../utils/interface-check.ts';

export const serializeCreateResourceOptions = (
  options: CreateResourceOptions,
): SerializedCreateResourceOptions => ({
  resource_type: isResourceInterface(options.resource)
    ? options.resource.getResourceType()
    : options.resource.resourceType,
  resource_id: isResourceInterface(options.resource)
    ? options.resource.getResourceId()
    : options.resource.resourceId
    ? options.resource.resourceId
    : '',
  meta: options.meta,
});
