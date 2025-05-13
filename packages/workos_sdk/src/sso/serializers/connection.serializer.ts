import type { Connection } from "workos/sso/interfaces/index.ts";

export function deserializeConnection(data: unknown): Connection {
  const record = data as Record<string, unknown>;
  return {
    id: record.id as string,
    name: record.name as string,
    state: record.state as string,
    type: record.type as string,
    organization_id: record.organization_id as string,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}
