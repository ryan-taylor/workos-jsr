import { deserializeAuthorizationModel } from './serializers/authorization-model.serializer.ts';
import { serializeListModelsOptions } from './serializers/list-models-options.serializer.ts';
import type {
  AuthorizationModel,
  CheckOptions,
  CreateModelOptions,
  ListModelsOptions,
} from './interfaces/index.ts';
import { fetchAndDeserialize } from '../common/utils/fetch-and-deserialize.ts';
import type { WorkOS } from '../workos.ts';
import type { PaginationOptions } from '../common/interfaces/index.ts';

export class FGA {
  constructor(private readonly workos: WorkOS) {}

  async createModel(options: CreateModelOptions): Promise<AuthorizationModel> {
    const result = await fetchAndDeserialize<Record<string, unknown>, AuthorizationModel>(
      this.workos,
      '/fga/authorization_models',
      (item: unknown) => deserializeAuthorizationModel(item as Record<string, unknown>),
      {
        data: options,
      } as PaginationOptions
    );
    return result as unknown as AuthorizationModel;
  }

  async getModel(id: string): Promise<AuthorizationModel> {
    const result = await fetchAndDeserialize<Record<string, unknown>, AuthorizationModel>(
      this.workos,
      `/fga/authorization_models/${id}`,
      (item: unknown) => deserializeAuthorizationModel(item as Record<string, unknown>)
    );
    return result as unknown as AuthorizationModel;
  }

  async listModels(options: ListModelsOptions): Promise<AuthorizationModel[]> {
    const result = await fetchAndDeserialize<Record<string, unknown>, AuthorizationModel[]>(
      this.workos,
      '/fga/authorization_models',
      (item: unknown) => deserializeAuthorizationModel(item as Record<string, unknown>),
      {
        ...serializeListModelsOptions(options),
      } as PaginationOptions
    );
    return Array.isArray(result) ? result : [result as unknown as AuthorizationModel];
  }

  async check(options: CheckOptions): Promise<boolean> {
    const result = await fetchAndDeserialize<Record<string, unknown>, boolean>(
      this.workos,
      '/fga/check',
      (item: unknown) => {
        const data = item as Record<string, unknown>;
        return data.allowed as boolean;
      },
      {
        data: options,
      } as PaginationOptions
    );
    return result as unknown as boolean;
  }
}