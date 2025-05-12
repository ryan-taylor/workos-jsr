import type {
  V2CheckItem,
  V2CheckOptions,
  V2SerializedCheckItem,
  V2SerializedCheckOptions,
  V2CheckBatchOptions,
  V2SerializedCheckBatchOptions,
  CheckOptions,
} from "../interfaces/index.ts";
import { isResourceInterface } from "../utils/interface-check.ts";

/**
 * Serializes a check item for the API
 * @param item The check item to serialize
 * @returns The serialized check item
 */
const serializeCheckItem = (item: V2CheckItem): V2SerializedCheckItem => {
  const { resource, relation, subject, context } = item;

  const resourceType = isResourceInterface(resource)
    ? resource.getResourceType()
    : resource.resourceType;

  const resourceId = isResourceInterface(resource)
    ? resource.getResourceId()
    : resource.resourceId;

  let subjectType, subjectId, subjectRelation;

  if (isResourceInterface(subject)) {
    subjectType = subject.getResourceType();
    subjectId = subject.getResourceId();
  } else {
    subjectType = subject.resourceType;
    subjectId = subject.resourceId;
    subjectRelation = subject.relation;
  }

  return {
    resource_type: resourceType,
    resource_id: resourceId as string,
    relation,
    subject: {
      resource_type: subjectType,
      resource_id: subjectId,
      relation: subjectRelation,
    },
    context,
  };
};

/**
 * Serializes check options for the API
 * 
 * This translates from the standard CheckOptions format to the internal format
 * used by the API which is represented by V2CheckOptions.
 * 
 * @param options The check options
 * @returns The serialized check options
 */
export const serializeCheckOptions = (options: CheckOptions): V2SerializedCheckOptions => {
  // Handle V2 batch format if it has the 'checks' property
  if (options.checks) {
    return serializeCheckBatchOptions(options as V2CheckBatchOptions);
  }
  
  // Handle standard format (requires user, relation, object properties)
  const { user, relation, object } = options;
  
  // Verify that all required properties exist for standard format
  if (!user || !relation || !object) {
    throw new Error('CheckOptions must include user, relation, and object properties');
  }
  
  // Create a structured check item
  const checkItem: V2CheckItem = {
    resource: {
      resourceType: object.split(':')[0],
      resourceId: object.split(':')[1],
    },
    relation,
    subject: {
      resourceType: user.split(':')[0],
      resourceId: user.split(':')[1],
    }
  };
  
  return {
    checks: [serializeCheckItem(checkItem)],
  };
};

/**
 * Serializes batch check options for the API
 * @param options The batch check options
 * @returns The serialized batch check options
 */
export const serializeCheckBatchOptions = (
  options: V2CheckBatchOptions,
): V2SerializedCheckBatchOptions => {
  return {
    checks: options.checks.map(serializeCheckItem),
  };
};