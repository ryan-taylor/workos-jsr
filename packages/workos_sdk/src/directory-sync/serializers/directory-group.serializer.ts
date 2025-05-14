import type { DirectoryGroup } from "../interfaces/index.ts";

export function deserializeDirectoryGroup(data: unknown): DirectoryGroup {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    name: record.name as string,
    directory_id: record.directory_id as string,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}
