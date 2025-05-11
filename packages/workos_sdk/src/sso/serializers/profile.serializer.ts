import type { Profile } from '../interfaces/index.ts';

export function deserializeProfile(data: Record<string, unknown>): Profile {
  return {
    id: data.id as string,
    email: data.email as string,
    first_name: data.first_name as string,
    last_name: data.last_name as string,
    connection_id: data.connection_id as string,
    organization_id: data.organization_id as string,
    raw_attributes: data.raw_attributes as Record<string, unknown>,
  };
}