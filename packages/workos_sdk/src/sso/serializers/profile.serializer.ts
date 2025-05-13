import type { Profile } from "workos/sso/interfaces/index.ts";

export function deserializeProfile(data: unknown): Profile {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    email: record.email as string,
    first_name: record.first_name as string,
    last_name: record.last_name as string,
    connection_id: record.connection_id as string,
    organization_id: record.organization_id as string,
    raw_attributes: record.raw_attributes as Record<string, unknown>,
  };
}
