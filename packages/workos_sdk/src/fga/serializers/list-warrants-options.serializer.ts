import type {
  ListWarrantsOptions,
  SerializedListWarrantsOptions,
} from "workos/fga/interfaces/index.ts";

/**
 * Serializes list warrants options for the API
 * @param options The list warrants options
 * @returns The serialized list warrants options
 */
export const serializeListWarrantsOptions = (
  options: ListWarrantsOptions,
): SerializedListWarrantsOptions => {
  const {
    resourceType,
    resourceId,
    relation,
    subjectType,
    subjectId,
    subjectRelation,
    ...pagination
  } = options;

  return {
    resource_type: resourceType,
    resource_id: resourceId,
    relation,
    subject_type: subjectType,
    subject_id: subjectId,
    subject_relation: subjectRelation,
    ...pagination,
  };
};