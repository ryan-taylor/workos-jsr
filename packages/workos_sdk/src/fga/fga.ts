import { deserializeAuthorizationModel } from "./serializers/authorization-model.serializer.ts";
import { serializeListModelsOptions } from "./serializers/list-models-options.serializer.ts";
import type {
  AuthorizationModel,
  CheckOptions,
  CreateModelOptions,
  ListModelsOptions,
} from "./interfaces/index.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";
import type { List, PaginationOptions } from "../common/interfaces.ts";

export class FGA {
  constructor(private readonly workos: WorkOS) {}

  async createModel(options: CreateModelOptions): Promise<AuthorizationModel> {
    const result = await fetchAndDeserialize<Record<string, unknown>, AuthorizationModel>(
      {
        workos: this.workos,
        path: "/fga/authorization_models",
        method: "POST",
        data: options,
        deserializer: (item: unknown) => deserializeAuthorizationModel(item as Record<string, unknown>),
      }
    );
    return result as AuthorizationModel;
  }

  async getModel(id: string): Promise<AuthorizationModel> {
    const result = await fetchAndDeserialize<Record<string, unknown>, AuthorizationModel>(
      {
        workos: this.workos,
        path: `/fga/authorization_models/${id}`,
        deserializer: (item: unknown) => deserializeAuthorizationModel(item as Record<string, unknown>),
      }
    );
    return result as AuthorizationModel;
  }

  async listModels(options: ListModelsOptions): Promise<AuthorizationModel[]> {
    const result = await fetchAndDeserialize<Record<string, unknown>, AuthorizationModel>(
      {
        workos: this.workos,
        path: "/fga/authorization_models",
        deserializer: (item: unknown) => deserializeAuthorizationModel(item as Record<string, unknown>),
        queryParams: serializeListModelsOptions(options),
      }
    );
    
    // Handle the case where result might be a List<AuthorizationModel>
    if (result && typeof result === 'object' && 'data' in result) {
      // It's a List, return data array
      return (result as List<AuthorizationModel>).data;
    }
    
    // Convert single item to array if needed
    return Array.isArray(result) ? result : [result];
  }

  async check(options: CheckOptions): Promise<boolean> {
    const result = await fetchAndDeserialize<Record<string, unknown>, boolean>(
      {
        workos: this.workos,
        path: "/fga/check",
        method: "POST",
        data: options,
        deserializer: (item: unknown) => {
          const data = item as Record<string, unknown>;
          return Boolean(data.allowed);
        },
      }
    );
    return Boolean(result);
  }
}
