import type {
  WriteWarrantOptions,
  SerializedWriteWarrantOptions,
  Subject,
} from "workos/fga/interfaces/index.ts";
import { isResourceInterface } from "workos/fga/utils/interface-check.ts";

/**
 * Serializes write warrant options for the API
 * @param options The write warrant options
 * @returns The serialized write warrant options
 */
export const serializeWriteWarrantOptions = (
  options: WriteWarrantOptions,
): SerializedWriteWarrantOptions => {
  const { resource, relation, subject, policy, op } = options;
  
  const resourceType = isResourceInterface(resource)
    ? resource.getResourceType()
    : resource.resourceType;
  
  const resourceId = isResourceInterface(resource)
    ? resource.getResourceId()
    : resource.resourceId;

  let serializedSubject;
  if (isResourceInterface(subject)) {
    serializedSubject = {
      resource_type: subject.getResourceType(),
      resource_id: subject.getResourceId(),
    };
  } else {
    const subjectResource = subject as Subject;
    serializedSubject = {
      resource_type: subjectResource.resourceType,
      resource_id: subjectResource.resourceId,
      relation: subjectResource.relation,
    };
  }

  return {
    op,
    resource_type: resourceType,
    resource_id: resourceId as string,
    relation,
    subject: serializedSubject,
    policy,
  };
};