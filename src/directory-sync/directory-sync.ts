import type { WorkOS } from "../workos.ts";
import { AutoPaginatable } from "../common/utils/pagination.ts";
import type {
  DefaultCustomAttributes,
  Directory,
  DirectoryGroup,
  DirectoryGroupResponse,
  DirectoryResponse,
  DirectoryUserWithGroups,
  DirectoryUserWithGroupsResponse,
  ListDirectoriesOptions,
  ListDirectoryGroupsOptions,
  ListDirectoryUsersOptions,
} from "./interfaces.ts";
import {
  deserializeDirectory,
  deserializeDirectoryGroup,
  deserializeDirectoryUserWithGroups,
  serializeListDirectoriesOptions,
} from "./serializers.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { PaginationOptions } from "../common/interfaces.ts";

export class DirectorySync {
  constructor(private readonly workos: WorkOS) {}

  async listDirectories(
    options?: ListDirectoriesOptions,
  ): Promise<AutoPaginatable<Directory>> {
    const data = await fetchAndDeserialize<
      DirectoryResponse,
      Directory,
      Record<string, unknown>
    >(
      this.workos.get.bind(this.workos),
      "/directories",
      options ? serializeListDirectoriesOptions(options) : undefined,
      deserializeDirectory,
    );

    return new AutoPaginatable(() =>
      Promise.resolve({
        data: [data],
        list_metadata: { before: null, after: null },
      })
    );
  }

  async getDirectory(id: string): Promise<Directory> {
    const { data } = await this.workos.get<DirectoryResponse>(
      `/directories/${id}`,
    );

    return deserializeDirectory(data);
  }

  deleteDirectory(id: string): Promise<void> {
    return this.workos.delete(`/directories/${id}`);
  }

  async listGroups(
    options: ListDirectoryGroupsOptions,
  ): Promise<AutoPaginatable<DirectoryGroup>> {
    const data = await fetchAndDeserialize<
      DirectoryGroupResponse,
      DirectoryGroup,
      Record<string, unknown>
    >(
      this.workos.get.bind(this.workos),
      "/directory_groups",
      options,
      deserializeDirectoryGroup,
    );

    return new AutoPaginatable(() =>
      Promise.resolve({
        data: [data],
        list_metadata: { before: null, after: null },
      })
    );
  }

  async listUsers<TCustomAttributes extends object = DefaultCustomAttributes>(
    options: ListDirectoryUsersOptions,
  ): Promise<AutoPaginatable<DirectoryUserWithGroups<TCustomAttributes>>> {
    const data = await fetchAndDeserialize<
      DirectoryUserWithGroupsResponse<TCustomAttributes>,
      DirectoryUserWithGroups<TCustomAttributes>,
      Record<string, unknown>
    >(
      this.workos.get.bind(this.workos),
      "/directory_users",
      options,
      deserializeDirectoryUserWithGroups,
    );

    return new AutoPaginatable(() =>
      Promise.resolve({
        data: [data],
        list_metadata: { before: null, after: null },
      })
    );
  }

  async getUser<TCustomAttributes extends object = DefaultCustomAttributes>(
    user: string,
  ): Promise<DirectoryUserWithGroups<TCustomAttributes>> {
    const { data } = await this.workos.get<
      DirectoryUserWithGroupsResponse<TCustomAttributes>
    >(`/directory_users/${user}`);

    return deserializeDirectoryUserWithGroups(data);
  }

  async getGroup(group: string): Promise<DirectoryGroup> {
    const { data } = await this.workos.get<DirectoryGroupResponse>(
      `/directory_groups/${group}`,
    );

    return deserializeDirectoryGroup(data);
  }
}
