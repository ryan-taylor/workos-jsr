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

/**
 * Service for Fine-Grained Authorization (FGA) in WorkOS.
 * 
 * FGA provides a flexible, scalable authorization system that lets you model complex
 * access control scenarios and perform authorization checks at runtime.
 * 
 * @example
 * ```ts
 * // Check if a user has a specific permission
 * const hasAccess = await workos.fga.check({
 *   user: 'user:123',
 *   relation: 'can_edit',
 *   object: 'document:456'
 * });
 * 
 * if (hasAccess) {
 *   // Allow the user to edit the document
 * } else {
 *   // Show access denied message
 * }
 * ```
 */
export class FGA {
  constructor(private readonly workos: WorkOS) {}

  /**
   * Creates a new authorization model.
   * 
   * @param options - Configuration options for creating the authorization model
   * @returns Promise resolving to the created authorization model
   * 
   * @example
   * ```ts
   * const model = await workos.fga.createModel({
   *   schema_version: '1.1',
   *   type_definitions: [
   *     {
   *       type: 'user',
   *       relations: {}
   *     },
   *     {
   *       type: 'document',
   *       relations: {
   *         reader: {
   *           this: {}
   *         },
   *         writer: {
   *           this: {}
   *         },
   *         owner: {
   *           this: {}
   *         }
   *       },
   *       metadata: {
   *         relations: {
   *           reader: { directly_related_user_types: [{ type: 'user' }] },
   *           writer: { directly_related_user_types: [{ type: 'user' }] },
   *           owner: { directly_related_user_types: [{ type: 'user' }] }
   *         }
   *       }
   *     }
   *   ]
   * });
   * ```
   */
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

  /**
   * Retrieves an authorization model by its ID.
   * 
   * @param id - The unique identifier of the authorization model
   * @returns Promise resolving to the authorization model
   * 
   * @example
   * ```ts
   * const model = await workos.fga.getModel('01FMJA27YCE3QAT8RDS9VZFN0T');
   * console.log(`Model created at: ${model.created_at}`);
   * ```
   */
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

  /**
   * Lists authorization models with optional filtering.
   * 
   * @param options - Configuration options for listing authorization models
   * @returns Promise resolving to an array of authorization models
   * 
   * @example
   * ```ts
   * const models = await workos.fga.listModels({
   *   page_size: 10
   * });
   * 
   * for (const model of models) {
   *   console.log(`Model ID: ${model.id}, Created: ${model.created_at}`);
   * }
   * ```
   */
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

  /**
   * Checks if a user has a specific permission on an object.
   * 
   * @param options - Configuration options for the authorization check
   * @returns Promise resolving to a boolean indicating if access is allowed
   * 
   * @example
   * ```ts
   * // Check if user 123 can view document 456
   * const canView = await workos.fga.check({
   *   user: 'user:123',
   *   relation: 'reader',
   *   object: 'document:456'
   * });
   * 
   * if (canView) {
   *   // Show the document
   * } else {
   *   // Show access denied
   * }
   * ```
   */
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
