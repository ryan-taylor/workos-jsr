import type { SessionAuth } from "../interfaces/index.ts";
import type { User } from "../interfaces/index.ts";

/**
 * Deserializes a raw session authentication response into a typed SessionAuth object
 *
 * @param data - Raw session data from the API
 * @returns A properly typed SessionAuth object
 */
export function deserializeSessionAuth(
  data: Record<string, unknown>,
): SessionAuth {
  // Ensure we have all required fields
  if (!data.user || typeof data.user !== "object") {
    throw new Error("Invalid session data: missing or invalid user object");
  }

  // Convert snake_case to camelCase for tokens if needed
  const accessToken = (data.access_token || data.accessToken) as string;
  const refreshToken = (data.refresh_token || data.refreshToken) as string;

  if (!accessToken || !refreshToken) {
    throw new Error("Invalid session data: missing access or refresh token");
  }

  // Extract user data
  const userData = data.user as Record<string, unknown>;

  // Create a user object that matches the SessionAuth.user shape with index signature
  const user = {
    id: userData.id as string,
    email: userData.email as string,
    first_name: userData.first_name as string | undefined,
    last_name: userData.last_name as string | undefined,
    created_at: userData.created_at as string,
    updated_at: userData.updated_at as string,
    ...userData,
  } as SessionAuth["user"]; // Cast to the expected shape with index signature

  // Construct and return the session auth object
  return {
    user,
    accessToken,
    refreshToken,
    sessionId: data.session_id as string || (userData.id as string),
    ...data,
  };
}
