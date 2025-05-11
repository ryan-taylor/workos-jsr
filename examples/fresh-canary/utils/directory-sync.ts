// Utility functions for integrating Directory Sync with Fresh 2.x

import { WorkOS } from '../../../src/workos.ts';
import type { FreshSessionProvider } from '../../../src/common/iron-session/fresh-session-provider.ts';
import { DenoCryptoProvider } from '../../../src/common/crypto/deno-crypto-provider.ts';

// Session configuration - using same as user-management for consistency
export const SESSION_OPTIONS = {
  cookieName: 'workos_session',
  password: Deno.env.get('SESSION_SECRET') || 'use-a-strong-password-in-production',
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  secure: true,
  httpOnly: true,
  sameSite: 'Lax' as const,
};

// Type definitions for Directory Sync
export interface Directory {
  object: string;
  id: string;
  domain: string;
  externalKey: string;
  name: string;
  organizationId?: string;
  state: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectoryGroup {
  object: string;
  id: string;
  idpId: string;
  directoryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  rawAttributes?: Record<string, unknown>;
}

export interface DirectoryUser {
  object: string;
  id: string;
  directoryId: string;
  idpId: string;
  emails: {
    primary: boolean;
    type: string;
    value: string;
  }[];
  firstName?: string;
  lastName?: string;
  username?: string;
  state: string;
  rawAttributes?: Record<string, unknown>;
  customAttributes?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DirectoryUserWithGroups extends DirectoryUser {
  groups: DirectoryGroup[];
}

/**
 * Initialize WorkOS Directory Sync
 * @returns WorkOS instance configured for directory sync
 */
export function initDirectorySync() {
  const workos = new WorkOS(
    Deno.env.get('WORKOS_API_KEY') || '',
    { clientId: Deno.env.get('WORKOS_CLIENT_ID') },
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
export async function getDirectory(workos: WorkOS, directoryId: string): Promise<Directory> {
  return await workos.directorySync.getDirectory(directoryId);
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
}): Promise<{ data: DirectoryGroup[]; listMetadata?: { before: string | null; after: string | null } }> {
  return await workos.directorySync.listGroups(options);
}

/**
 * Get directory group details
 * @param workos WorkOS instance
 * @param groupId Group ID
 * @returns Group details
 */
export async function getDirectoryGroup(workos: WorkOS, groupId: string): Promise<DirectoryGroup> {
  return await workos.directorySync.getGroup(groupId);
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
}): Promise<{ data: DirectoryUserWithGroups[]; listMetadata?: { before: string | null; after: string | null } }> {
  return await workos.directorySync.listUsers(options);
}

/**
 * Get directory user details
 * @param workos WorkOS instance
 * @param userId User ID
 * @returns User details
 */
export async function getDirectoryUser(workos: WorkOS, userId: string): Promise<DirectoryUserWithGroups> {
  return await workos.directorySync.getUser(userId);
}

/**
 * Initialize webhook handler for Directory Sync events
 * @returns Functions for verifying and handling webhook events
 */
export function initWebhooks() {
  const cryptoProvider = new DenoCryptoProvider();

  return {
    webhooks: new WorkOS().webhooks,
    constructEvent: async (payload: unknown, sigHeader: string, secret: string) => {
      return await new WorkOS().webhooks.constructEvent({
        payload,
        sigHeader,
        secret,
      });
    },
  };
}
