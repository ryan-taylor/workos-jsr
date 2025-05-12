import type { Organization } from "../interfaces.ts";

export function deserializeOrganization(data: unknown): Organization {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    name: record.name as string,
    domains: record.domains as string[],
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}
