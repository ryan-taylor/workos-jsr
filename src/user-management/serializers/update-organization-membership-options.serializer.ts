import type {
  SerializedUpdateOrganizationMembershipOptions,
  UpdateOrganizationMembershipOptions,
} from "../interfaces/update-organization-membership-options.interface.ts";

export const serializeUpdateOrganizationMembershipOptions = (
  options: UpdateOrganizationMembershipOptions,
): SerializedUpdateOrganizationMembershipOptions => ({
  role_slug: options.roleSlug,
});
