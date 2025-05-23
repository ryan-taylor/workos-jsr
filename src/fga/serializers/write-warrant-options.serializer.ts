import type {
  SerializedWriteWarrantOptions,
  WriteWarrantOptions,
} from "../interfaces.ts";
import { isResourceInterface, isSubject } from "../utils/interface-check.ts";

export const serializeWriteWarrantOptions = (
  warrant: WriteWarrantOptions,
): SerializedWriteWarrantOptions => ({
  op: warrant.op,
  resource_type: isResourceInterface(warrant.resource)
    ? warrant.resource.getResourceType()
    : warrant.resource.resourceType,
  resource_id: isResourceInterface(warrant.resource)
    ? warrant.resource.getResourceId()
    : warrant.resource.resourceId
    ? warrant.resource.resourceId
    : "",
  relation: warrant.relation,
  subject: isSubject(warrant.subject)
    ? {
      resource_type: warrant.subject.resourceType,
      resource_id: warrant.subject.resourceId,
    }
    : {
      resource_type: warrant.subject.getResourceType(),
      resource_id: warrant.subject.getResourceId(),
    },
  policy: warrant.policy,
});
