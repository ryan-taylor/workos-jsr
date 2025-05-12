import type {
  WarrantToken,
  WarrantTokenResponse,
} from "../interfaces/index.ts";

/**
 * Deserializes a warrant token response from the API
 * @param response The warrant token response from the API
 * @returns The deserialized warrant token
 */
export const deserializeWarrantToken = (
  response: WarrantTokenResponse,
): WarrantToken => ({
  warrantToken: response.warrant_token,
});