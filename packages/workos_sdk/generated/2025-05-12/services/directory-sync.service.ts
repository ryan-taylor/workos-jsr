/**
 * Generated DirectorySyncService for the WorkOS API
 * This service handles directory-related operations like listing and retrieving directories.
 */
import { request } from "../core/request.ts";
import type { Directory } from "../../../src/directory-sync/interfaces/index.ts";
import { deserializeDirectory } from "../../../src/directory-sync/serializers/index.ts";
import type { List } from "../../../src/common/interfaces.ts";

/**
 * Interface for list directories options
 */
export interface ListDirectoriesOptions {
  /** Optional limit for number of directories to return */
  limit?: number;
  /** Optional starting point for pagination */
  before?: string;
  /** Optional ending point for pagination */
  after?: string;
  /** Optional directory type filter */
  type?: string;
  /** Optional domain filter */
  domain?: string;
}

/**
 * Service for interacting with WorkOS Directory Sync API
 */
export class DirectorySyncService {
  /**
   * Retrieves a directory by its ID.
   * @param id - The unique identifier of the directory
   * @returns Promise resolving to the Directory object
   */
  async getDirectory(id: string): Promise<Directory> {
    const data = await request<Record<string, unknown>>({
      method: "GET",
      url: `/directories/${id}`,
    });
    return deserializeDirectory(data);
  }

  /**
   * Lists directories with optional pagination and filtering options.
   * 
   * @param options - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of Directory objects
   */
  async listDirectories(options: ListDirectoriesOptions = {}): Promise<List<Directory>> {
    const response = await request<{
      data: Record<string, unknown>[];
      list_metadata: {
        before: string | null;
        after: string | null;
      };
    }>({
      method: "GET",
      url: "/directories",
      query: options as Record<string, unknown>,
    });

    return {
      object: "list",
      data: response.data.map(deserializeDirectory),
      listMetadata: {
        before: response.list_metadata.before,
        after: response.list_metadata.after,
      },
    };
  }

  /**
   * Lists groups for a directory.
   * 
   * @param options - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of DirectoryGroup objects
   */
  async listGroups(options: Record<string, unknown> = {}): Promise<any> {
    const response = await request<any>({
      method: "GET",
      url: "/directory_groups",
      query: options,
    });
    
    // This would be implemented similar to listDirectories but with group serializers
    return response;
  }

  /**
   * Lists users for a directory.
   * 
   * @param options - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of DirectoryUser objects
   */
  async listUsers(options: Record<string, unknown> = {}): Promise<any> {
    const response = await request<any>({
      method: "GET",
      url: "/directory_users",
      query: options,
    });
    
    // This would be implemented similar to listDirectories but with user serializers
    return response;
  }
}