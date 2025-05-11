import type { Directory } from "../interfaces/index.ts";

export function deserializeDirectory(data: Record<string, unknown>): Directory {
  return {
    id: data.id as string,
    name: data.name as string,
    type: data.type as string,
    state: data.state as string,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}
