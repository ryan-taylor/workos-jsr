import type {
  Warrant,
  WarrantResponse,
  WarrantToken,
  WarrantTokenResponse,
} from "workos/fga/interfaces/index.ts";

/**
 * Deserializes a warrant response from the API to a Warrant object
 * @param warrant The warrant response from the API
 * @returns The deserialized Warrant object
 */
export const deserializeWarrant = (warrant: WarrantResponse): Warrant => ({
  resourceType: warrant.resource_type,
  resourceId: warrant.resource_id,
  relation: warrant.relation,
  subject: {
    resourceType: warrant.subject.resource_type,
    resourceId: warrant.subject.resource_id,
    relation: warrant.subject.relation,
  },
  policy: warrant.policy,
});

/**
 * Deserializes a warrant token response from the API
 * @param response The warrant token response from the API
 * @returns The deserialized WarrantToken object
 */
export const deserializeWarrantToken = (
  response: WarrantTokenResponse,
): WarrantToken => ({
  warrantToken: response.warrant_token,
});