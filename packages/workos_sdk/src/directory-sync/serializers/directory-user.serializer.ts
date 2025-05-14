import type { DirectoryUser } from "../interfaces/index.ts";

export function deserializeDirectoryUser(data: unknown): DirectoryUser {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    directory_id: record.directory_id as string,
    email: record.email as string,
    username: record.username as string,
    first_name: record.first_name as string,
    last_name: record.last_name as string,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}
