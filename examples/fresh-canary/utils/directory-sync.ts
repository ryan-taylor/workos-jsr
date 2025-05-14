// Utility functions for integrating Directory Sync with Fresh 2.x

import { WorkOS } from "../../../mod.ts";
import type { FreshSessionProvider } from "../../../packages/workos_sdk/src/common/iron-session/fresh-session-provider.ts";
import { SubtleCryptoProvider } from "../../../packages/workos_sdk/src/common/crypto/subtle-crypto-provider.ts";
import { Webhooks } from "../../../packages/workos_sdk/src/webhooks/webhooks.ts";

// Session configuration - using same as user-management for consistency
export const SESSION_OPTIONS = {
  cookieName: "workos_session",
  password: Deno.env.get("SESSION_SECRET") ??
    "use-a-strong-password-in-production",
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: "Lax" as const,
};

// Import types from the SDK
import type {
  Directory,
  DirectoryGroup,
  DirectoryUser,
} from "../../../packages/workos_sdk/src/directory-sync/interfaces/index.ts";
import type { List } from "../../../packages/workos_sdk/src/common/interfaces.ts";

// Extended interface for users with groups
export interface DirectoryUserWithGroups extends DirectoryUser {
  groups: DirectoryGroup[];
}

/**
 * Initialize WorkOS Directory Sync
 * @returns WorkOS instance configured for directory sync
 */
export function initDirectorySync() {
  const apiKey = Deno.env.get("WORKOS_API_KEY");
  if (apiKey === null) {
    throw new Error("Environment variable WORKOS_API_KEY is required");
  }

  const workos = new WorkOS(
    apiKey,
    { clientId: Deno.env.get("WORKOS_CLIENT_ID") ?? undefined },
  );

  return { workos };
}

/**
 * List all directories
 * @param workos WorkOS instance
 * @param options Optional filtering options
 * @returns Paginated list of directories
 */
export async function listDirectories(workos: WorkOS, options?: {
  limit?: number;
  before?: string;
  after?: string;
  organizationId?: string;
  search?: string;
}) {
  return await workos.directorySync.listDirectories(options);
}

/**
 * Get directory details
 * @param workos WorkOS instance
 * @param directoryId Directory ID
 * @returns Directory details
 */
export async function getDirectory(
  workos: WorkOS,
  directoryId: string,
): Promise<Directory> {
  const result = await workos.directorySync.getDirectory(directoryId);
  return result;
}

/**
 * List directory groups
 * @param workos WorkOS instance
 * @param options Filter options (required)
 * @returns Paginated list of directory groups
 */
export async function listDirectoryGroups(workos: WorkOS, options: {
  directory: string;
  limit?: number;
  before?: string;
  after?: string;
  user?: string;
}): Promise<List<DirectoryGroup>> {
  return await workos.directorySync.listGroups(options);
}

/**
 * Get directory group details
 * @param workos WorkOS instance
 * @param groupId Group ID
 * @returns Group details
 * Note: getGroup is not available in the DirectorySync API for Deno 2.x
 */
export async function getDirectoryGroup(
  workos: WorkOS,
  groupId: string,
): Promise<DirectoryGroup | null> {
  // This functionality is not directly available in Deno 2.x version
  console.warn("getDirectoryGroup not available in current SDK version");
  return null;
}

/**
 * List directory users
 * @param workos WorkOS instance
 * @param options Filter options (required)
 * @returns Paginated list of directory users
 */
export async function listDirectoryUsers(workos: WorkOS, options: {
  directory: string;
  limit?: number;
  before?: string;
  after?: string;
  group?: string;
}): Promise<List<DirectoryUser>> {
  return await workos.directorySync.listUsers(options);
}

/**
 * Get directory user details
 * @param workos WorkOS instance
 * @param userId User ID
 * @returns User details
 * Note: getUser is not available in the DirectorySync API for Deno 2.x
 */
export async function getDirectoryUser(
  workos: WorkOS,
  userId: string,
): Promise<DirectoryUser | null> {
  // This functionality is not directly available in Deno 2.x version
  console.warn("getDirectoryUser not available in current SDK version");
  return null;
}

/**
 * Initialize webhook handler for Directory Sync events
 * @returns Functions for verifying and handling webhook events
 */
export function initWebhooks() {
  const cryptoProvider = new SubtleCryptoProvider();

  return {
    webhooks: new WorkOS().webhooks,
    constructEvent: async (
      payload: unknown,
      sigHeader: string,
      secret: string,
    ) => {
      // Use the static Webhooks.constructEvent method
      return Webhooks.constructEvent(
        typeof payload === "string" ? payload : JSON.stringify(payload),
        sigHeader,
        secret,
      );
    },
  };
}
