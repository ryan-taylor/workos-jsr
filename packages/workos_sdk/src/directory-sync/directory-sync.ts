import { deserializeDirectory } from "./serializers/index.ts";
import type { Directory } from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";

export class DirectorySync {
  private workos: WorkOS;

  constructor(workos: WorkOS) {
    this.workos = workos;
  }

  async getDirectory(id: string): Promise<Directory> {
    const { data } = await this.workos.get<Record<string, unknown>>(
      `/directories/${id}`,
    );
    return deserializeDirectory(data);
  }
}
