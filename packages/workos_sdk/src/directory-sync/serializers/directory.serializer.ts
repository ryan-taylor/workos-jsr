import type { Directory, EventDirectory } from "../interfaces/index.ts";

export function deserializeDirectory(data: unknown): Directory {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    name: record.name as string,
    type: record.type as string,
    state: record.state as string,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

export function deserializeEventDirectory(data: unknown): EventDirectory {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    name: record.name as string,
    type: record.type as string,
    state: record.state as string,
    domains: record.domains as string[],
    externalKey: record.external_key as string,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

export function deserializeDeletedEventDirectory(
  data: unknown,
): Omit<EventDirectory, "domains" | "externalKey"> {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    name: record.name as string,
    type: record.type as string,
    state: record.state as string,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}
