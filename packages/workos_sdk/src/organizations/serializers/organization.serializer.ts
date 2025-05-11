import type { Organization } from '../interfaces';

export function deserializeOrganization(data: Record<string, unknown>): Organization {
  return {
    id: data.id as string,
    name: data.name as string,
    domains: data.domains as string[],
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}