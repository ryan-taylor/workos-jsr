import type { Connection } from "../interfaces/index.ts";

export function deserializeConnection(
  data: Record<string, unknown>,
): Connection {
  return {
    id: data.id as string,
    name: data.name as string,
    state: data.state as string,
    type: data.type as string,
    organization_id: data.organization_id as string,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
