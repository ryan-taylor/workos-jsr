import {
  deserializeDirectory,
  deserializeDirectoryGroup,
  deserializeDirectoryUser
} from "workos/directory-sync/serializers/index.ts";
import type {
  Directory,
  DirectoryGroup,
  DirectoryUser
} from "workos/directory-sync/interfaces/index.ts";
import { fetchAndDeserialize } from "workos/common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "workos/workos.ts";
import { DirectorySyncService, setWorkOSInstance } from "workos/../generated/2025-05-12/index.ts";
import type { CommonGetOptions, List } from "workos/common/interfaces.ts";

/**
 * Service for WorkOS Directory Sync.
 * 
 * The Directory Sync API allows you to manage directory connections and sync users
 * between your application and external identity providers.
 * 
 * @example
 * ```ts
 * // Retrieve a directory by ID
 * const directory = await workos.directorySync.getDirectory('directory_123');
 * console.log(directory.id, directory.name);
 * ```
 */
export class DirectorySync {
  private workos: WorkOS;
  private directorySyncService: DirectorySyncService;

  /**
   * Creates a new DirectorySync client.
   * @param workos - The main WorkOS client instance
   */
  constructor(workos: WorkOS) {
    this.workos = workos;
    // Initialize the WorkOS instance for generated services
    setWorkOSInstance(workos);
    this.directorySyncService = new DirectorySyncService();
  }

  /**
   * Retrieves a directory by its ID.
   * @param id - The unique identifier of the directory
   * @returns Promise resolving to the Directory object
   */
  async getDirectory(id: string): Promise<Directory> {
    // Use the generated service to get a directory
    return await this.directorySyncService.getDirectory(id);
  }

  /**
   * Lists directories with optional pagination/query params.
   * 
   * @param query - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of Directory objects
   */
  async listDirectories(query: Record<string, unknown> = {}): Promise<List<Directory>> {
    // Use the generated service to list directories
    return await this.directorySyncService.listDirectories(query);
  }

  /**
   * Lists groups for a directory.
   * 
   * @param query - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of DirectoryGroup objects
   */
  async listGroups(query: Record<string, unknown> = {}): Promise<List<DirectoryGroup>> {
    // Use the generated service to list groups
    return await this.directorySyncService.listGroups(query);
  }

  /**
   * Lists users for a directory.
   * 
   * @param query - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of DirectoryUser objects
   */
  async listUsers(query: Record<string, unknown> = {}): Promise<List<DirectoryUser>> {
    // Use the generated service to list users
    return await this.directorySyncService.listUsers(query);
  }
}
