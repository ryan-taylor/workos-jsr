import type { AuthorizationModel } from '../interfaces/index.ts';

export function deserializeAuthorizationModel(data: Record<string, unknown>): AuthorizationModel {
  return {
    id: data.id as string,
    organization_id: data.organization_id as string,
    schema: data.schema as Record<string, unknown>,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}