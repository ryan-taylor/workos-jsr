import { deserializeDirectory } from "./serializers/index.ts";
import type { Directory } from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";

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
}
