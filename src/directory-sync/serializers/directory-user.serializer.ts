import type {
  DefaultCustomAttributes,
  DirectoryUser,
  DirectoryUserResponse,
  DirectoryUserWithGroups,
  DirectoryUserWithGroupsResponse,
} from "../interfaces.ts";
import { deserializeDirectoryGroup } from "./directory-group.serializer.ts";

export const deserializeDirectoryUser = <
  TCustomAttributes extends object = DefaultCustomAttributes,
>(
  directoryUser:
    | DirectoryUserResponse<TCustomAttributes>
    | DirectoryUserWithGroupsResponse<TCustomAttributes>,
): DirectoryUser<TCustomAttributes> => ({
  object: directoryUser.object,
  id: directoryUser.id,
  directoryId: directoryUser.directory_id,
  organizationId: directoryUser.organization_id,
  rawAttributes: directoryUser.raw_attributes,
  customAttributes: directoryUser.custom_attributes,
  idpId: directoryUser.idp_id,
  firstName: directoryUser.first_name,
  email: directoryUser.email,
  emails: directoryUser.emails,
  username: directoryUser.username,
  lastName: directoryUser.last_name,
  jobTitle: directoryUser.job_title,
  state: directoryUser.state,
  role: directoryUser.role,
  createdAt: directoryUser.created_at,
  updatedAt: directoryUser.updated_at,
});

export const deserializeDirectoryUserWithGroups = <
  TCustomAttributes extends object = DefaultCustomAttributes,
>(
  directoryUserWithGroups: DirectoryUserWithGroupsResponse<TCustomAttributes>,
): DirectoryUserWithGroups<TCustomAttributes> => ({
  ...deserializeDirectoryUser(directoryUserWithGroups),
  groups: directoryUserWithGroups.groups.map(deserializeDirectoryGroup),
});

export const deserializeUpdatedEventDirectoryUser = (
  directoryUser:
    & DirectoryUserResponse
    & Record<"previous_attributes", Record<string, unknown>>,
): DirectoryUser & Record<"previousAttributes", Record<string, unknown>> => ({
  object: "directory_user",
  id: directoryUser.id,
  directoryId: directoryUser.directory_id,
  organizationId: directoryUser.organization_id,
  rawAttributes: directoryUser.raw_attributes,
  customAttributes: directoryUser.custom_attributes,
  idpId: directoryUser.idp_id,
  firstName: directoryUser.first_name,
  email: directoryUser.email,
  emails: directoryUser.emails,
  username: directoryUser.username,
  lastName: directoryUser.last_name,
  jobTitle: directoryUser.job_title,
  state: directoryUser.state,
  role: directoryUser.role,
  createdAt: directoryUser.created_at,
  updatedAt: directoryUser.updated_at,
  previousAttributes: directoryUser.previous_attributes,
});
