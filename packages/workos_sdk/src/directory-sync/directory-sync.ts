import { 
  deserializeDirectory, 
  deserializeDirectoryGroup, 
  deserializeDirectoryUser 
} from "./serializers/index.ts";
import type { 
  Directory, 
  DirectoryGroup, 
  DirectoryUser 
} from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";
import type { GetOptions, List } from "../common/interfaces.ts";

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

  /**
   * Creates a new DirectorySync client.
   * @param workos - The main WorkOS client instance
   */
  constructor(workos: WorkOS) {
    this.workos = workos;
  }

  /**
   * Retrieves a directory by its ID.
   * @param id - The unique identifier of the directory
   * @returns Promise resolving to the Directory object
   */
  async getDirectory(id: string): Promise<Directory> {
    const { data } = await this.workos.get<Record<string, unknown>>(
      `/directories/${id}`,
    );
    return deserializeDirectory(data);
  }

  /**
   * Lists directories with optional pagination/query params.
   * 
   * @param query - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of Directory objects
   */
  async listDirectories(query: Record<string, unknown> = {}): Promise<List<Directory>> {
    const requestOptions: GetOptions = { query } as unknown as GetOptions;
    return await fetchAndDeserialize(
      this.workos,
      "/directories",
      deserializeDirectory,
      undefined,
      requestOptions,
    ) as List<Directory>;
  }

  /**
   * Lists groups for a directory.
   * 
   * @param query - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of DirectoryGroup objects
   */
  async listGroups(query: Record<string, unknown> = {}): Promise<List<DirectoryGroup>> {
    const requestOptions: GetOptions = { query } as unknown as GetOptions;
    return await fetchAndDeserialize(
      this.workos,
      "/directory_groups",
      deserializeDirectoryGroup,
      undefined,
      requestOptions,
    ) as List<DirectoryGroup>;
  }

  /**
   * Lists users for a directory.
   * 
   * @param query - Optional query parameters for filtering
   * @returns Promise resolving to a paginated List of DirectoryUser objects
   */
  async listUsers(query: Record<string, unknown> = {}): Promise<List<DirectoryUser>> {
    const requestOptions: GetOptions = { query } as unknown as GetOptions;
    return await fetchAndDeserialize(
      this.workos,
      "/directory_users",
      deserializeDirectoryUser,
      undefined,
      requestOptions,
    ) as List<DirectoryUser>;
  }
}
