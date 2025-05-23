import type { DirectoryGroup, DirectoryGroupResponse } from "../interfaces.ts";

export const deserializeDirectoryGroup = (
  directoryGroup: DirectoryGroupResponse,
): DirectoryGroup => ({
  id: directoryGroup.id,
  idpId: directoryGroup.idp_id,
  directoryId: directoryGroup.directory_id,
  organizationId: directoryGroup.organization_id,
  name: directoryGroup.name,
  createdAt: directoryGroup.created_at,
  updatedAt: directoryGroup.updated_at,
  rawAttributes: directoryGroup.raw_attributes,
});

export const deserializeUpdatedEventDirectoryGroup = (
  directoryGroup:
    & DirectoryGroupResponse
    & Record<"previous_attributes", Record<string, unknown>>,
): DirectoryGroup & Record<"previousAttributes", Record<string, unknown>> => ({
  id: directoryGroup.id,
  idpId: directoryGroup.idp_id,
  directoryId: directoryGroup.directory_id,
  organizationId: directoryGroup.organization_id,
  name: directoryGroup.name,
  createdAt: directoryGroup.created_at,
  updatedAt: directoryGroup.updated_at,
  rawAttributes: directoryGroup.raw_attributes,
  previousAttributes: directoryGroup.previous_attributes,
});
