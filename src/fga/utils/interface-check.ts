import type { ResourceInterface, Subject } from "../interfaces/index.ts";

export function isSubject(resource: unknown): resource is Subject {
  return (
    Object.prototype.hasOwnProperty.call(resource, "resourceType") &&
    Object.prototype.hasOwnProperty.call(resource, "resourceId")
  );
}

export function isResourceInterface(
  resource: unknown,
): resource is ResourceInterface {
  return (
    !!resource &&
    typeof resource === "object" &&
    "getResourceType" in resource &&
    "getResourceId" in resource
  );
}
