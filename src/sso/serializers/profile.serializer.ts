import type { UnknownRecord } from "../../common/interfaces/unknown-record.interface.ts";
import type { Profile, ProfileResponse } from "../interfaces.ts";

export const deserializeProfile = (
  profile: ProfileResponse,
): Profile => ({
  id: profile.id,
  idpId: profile.idp_id,
  organizationId: profile.organization_id,
  connectionId: profile.connection_id,
  connectionType: profile.connection_type,
  email: profile.email,
  firstName: profile.first_name,
  lastName: profile.last_name,
  role: profile.role,
  groups: profile.groups,
  customAttributes: profile.custom_attributes,
  rawAttributes: profile.raw_attributes,
});
