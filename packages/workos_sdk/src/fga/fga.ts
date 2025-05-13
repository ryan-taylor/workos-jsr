import type { WorkOS } from "workos/workos.ts";
import {
  type BatchWriteResourcesOptions,
  type BatchWriteResourcesResponse,
  type V2CheckBatchOptions,
  type CheckOptions,
  type V2CheckRequestOptions,
  V2CheckResult as CheckResult,
  type V2CheckResultResponse as CheckResultResponse,
  type CreateResourceOptions,
  type DeleteResourceOptions,
  type ListResourcesOptions,
  type ListWarrantsOptions,
  type ListWarrantsRequestOptions,
  type QueryOptions,
  type QueryRequestOptions,
  type QueryResult,
  type QueryResultResponse,
  type Resource,
  type ResourceInterface,
  type ResourceOptions,
  type ResourceResponse,
  type UpdateResourceOptions,
  type Warrant,
  type WarrantResponse,
  type WarrantToken,
  type WarrantTokenResponse,
  type WriteWarrantOptions,
} from "workos/fga/interfaces/index.ts";
import {
  deserializeBatchWriteResourcesResponse,
  deserializeQueryResult,
  deserializeResource,
  deserializeWarrant,
  deserializeWarrantToken,
  serializeBatchWriteResourcesOptions,
  serializeCheckBatchOptions,
  serializeCheckOptions,
  serializeCreateResourceOptions,
  serializeListResourceOptions,
  serializeListWarrantsOptions,
  serializeQueryOptions,
  serializeWriteWarrantOptions,
} from "workos/fga/serializers/index.ts";
import { isResourceInterface } from "workos/fga/utils/interface-check.ts";
import { AutoPaginatable } from "workos/common/utils/pagination.ts";
import { fetchAndDeserialize } from "workos/common/utils/fetch-and-deserialize.ts";
import type { List, PaginationOptions } from "workos/common/interfaces.ts";

/**
 * Service for Fine-Grained Authorization (FGA) in WorkOS.
 * 
 * FGA provides a flexible, scalable authorization system that lets you model complex
 * access control scenarios and perform authorization checks at runtime.
 */
export class FGA {
  constructor(private readonly workos: WorkOS) {}

  /**
   * Performs an authorization check.
   * 
   * @param checkOptions - The check options
   * @param options - Additional request options
   * @returns Promise resolving to a CheckResult
   */
  async check(
    checkOptions: CheckOptions,
    options: V2CheckRequestOptions = {},
  ): Promise<CheckResult> {
    const { data } = await this.workos.post<CheckResultResponse>(
      `/fga/v1/check`,
      serializeCheckOptions(checkOptions),
      options,
    );
    return new CheckResult(data);
  }

  /**
   * Performs batch authorization checks.
   * 
   * @param checkOptions - The batch check options
   * @param options - Additional request options
   * @returns Promise resolving to an array of CheckResults
   */
  async checkBatch(
    checkOptions: V2CheckBatchOptions,
    options: V2CheckRequestOptions = {},
  ): Promise<CheckResult[]> {
    const { data } = await this.workos.post<CheckResultResponse[]>(
      `/fga/v1/check`,
      serializeCheckBatchOptions(checkOptions),
      options,
    );
    return data.map(
      (checkResult: CheckResultResponse) => new CheckResult(checkResult),
    );
  }

  /**
   * Creates a new resource.
   * 
   * @param resource - The resource creation options
   * @returns Promise resolving to the created Resource
   */
  async createResource(resource: CreateResourceOptions): Promise<Resource> {
    const { data } = await this.workos.post<ResourceResponse>(
      "/fga/v1/resources",
      serializeCreateResourceOptions(resource),
    );

    return deserializeResource(data);
  }

  /**
   * Retrieves a resource by type and ID.
   * 
   * @param resource - The resource to retrieve
   * @returns Promise resolving to the Resource
   */
  async getResource(
    resource: ResourceInterface | ResourceOptions,
  ): Promise<Resource> {
    const resourceType = isResourceInterface(resource)
      ? resource.getResourceType()
      : resource.resourceType;
    const resourceId = isResourceInterface(resource)
      ? resource.getResourceId()
      : resource.resourceId;

    const { data } = await this.workos.get<ResourceResponse>(
      `/fga/v1/resources/${resourceType}/${resourceId}`,
    );

    return deserializeResource(data);
  }

  /**
   * Lists resources with optional filtering.
   * 
   * @param options - Optional listing options
   * @returns Promise resolving to a paginated list of Resources
   */
  async listResources(
    options?: ListResourcesOptions,
  ): Promise<AutoPaginatable<Resource>> {
    const deserializer = (item: unknown) => deserializeResource(item as ResourceResponse);
    
    // Get the initial page of resources
    const result = await fetchAndDeserialize<ResourceResponse, Resource>(
      this.workos,
      "/fga/v1/resources",
      deserializer,
      options ? serializeListResourceOptions(options) : undefined,
    );
    
    // Create an AutoPaginatable instance with the initial page data and a fetch function for loading more pages
    return new AutoPaginatable(
      result as unknown as List<Resource>,
      async (params: PaginationOptions) => {
        const nextPage = await fetchAndDeserialize<ResourceResponse, Resource>(
          this.workos,
          "/fga/v1/resources",
          deserializer,
          params,
        );
        return nextPage as unknown as List<Resource>;
      },
      options ? serializeListResourceOptions(options) : undefined,
    );
  }

  /**
   * Updates a resource.
   * 
   * @param options - The update options
   * @returns Promise resolving to the updated Resource
   */
  async updateResource(options: UpdateResourceOptions): Promise<Resource> {
    const resourceType = isResourceInterface(options.resource)
      ? options.resource.getResourceType()
      : options.resource.resourceType;
    const resourceId = isResourceInterface(options.resource)
      ? options.resource.getResourceId()
      : options.resource.resourceId;

    const { data } = await this.workos.put<ResourceResponse>(
      `/fga/v1/resources/${resourceType}/${resourceId}`,
      {
        meta: options.meta,
      },
    );

    return deserializeResource(data);
  }

  /**
   * Deletes a resource.
   * 
   * @param resource - The resource to delete
   * @returns Promise that resolves when the resource is deleted
   */
  async deleteResource(resource: DeleteResourceOptions): Promise<void> {
    const resourceType = isResourceInterface(resource)
      ? resource.getResourceType()
      : resource.resourceType;
    const resourceId = isResourceInterface(resource)
      ? resource.getResourceId()
      : resource.resourceId;

    await this.workos.delete(`/fga/v1/resources/${resourceType}/${resourceId}`);
  }

  /**
   * Performs batch operations on resources.
   * 
   * @param options - The batch options
   * @returns Promise resolving to an array of affected Resources
   */
  async batchWriteResources(
    options: BatchWriteResourcesOptions,
  ): Promise<Resource[]> {
    const { data } = await this.workos.post<BatchWriteResourcesResponse>(
      "/fga/v1/resources/batch",
      serializeBatchWriteResourcesOptions(options),
    );
    return deserializeBatchWriteResourcesResponse(data);
  }

  /**
   * Creates or deletes a warrant.
   * 
   * @param options - The warrant options
   * @returns Promise resolving to a WarrantToken
   */
  async writeWarrant(options: WriteWarrantOptions): Promise<WarrantToken> {
    const { data } = await this.workos.post<WarrantTokenResponse>(
      "/fga/v1/warrants",
      serializeWriteWarrantOptions(options),
    );

    return deserializeWarrantToken(data);
  }

  /**
   * Performs batch operations on warrants.
   * 
   * @param options - Array of warrant options
   * @returns Promise resolving to a WarrantToken
   */
  async batchWriteWarrants(
    options: WriteWarrantOptions[],
  ): Promise<WarrantToken> {
    const { data: warrantToken } = await this.workos.post<WarrantTokenResponse>(
      "/fga/v1/warrants",
      options.map(serializeWriteWarrantOptions),
    );

    return deserializeWarrantToken(warrantToken);
  }

  /**
   * Lists warrants with optional filtering.
   * 
   * @param options - Optional listing options
   * @param requestOptions - Additional request options
   * @returns Promise resolving to a paginated list of Warrants
   */
  async listWarrants(
    options?: ListWarrantsOptions,
    requestOptions?: ListWarrantsRequestOptions,
  ): Promise<AutoPaginatable<Warrant>> {
    const deserializer = (item: unknown) => deserializeWarrant(item as WarrantResponse);
    
    // Get the initial page of warrants
    const result = await fetchAndDeserialize<WarrantResponse, Warrant>(
      this.workos,
      "/fga/v1/warrants",
      deserializer,
      options ? serializeListWarrantsOptions(options) : undefined,
      requestOptions as any,
    );
    
    // Create an AutoPaginatable instance with the initial page data and a fetch function for loading more pages
    return new AutoPaginatable(
      result as unknown as List<Warrant>,
      async (params: PaginationOptions) => {
        const nextPage = await fetchAndDeserialize<WarrantResponse, Warrant>(
          this.workos,
          "/fga/v1/warrants",
          deserializer,
          params,
          requestOptions as any,
        );
        return nextPage as unknown as List<Warrant>;
      },
      options ? serializeListWarrantsOptions(options) : undefined,
    );
  }

  /**
   * Executes authorization queries.
   * 
   * @param options - The query options
   * @param requestOptions - Additional request options
   * @returns Promise resolving to a paginated list of QueryResults
   */
  async query(
    options: QueryOptions,
    requestOptions: QueryRequestOptions = {},
  ): Promise<AutoPaginatable<QueryResult>> {
    const deserializer = (item: unknown) => deserializeQueryResult(item as QueryResultResponse);
    
    // Get the initial page of query results
    const result = await fetchAndDeserialize<QueryResultResponse, QueryResult>(
      this.workos,
      "/fga/v1/query",
      deserializer,
      serializeQueryOptions(options),
      requestOptions as any,
    );
    
    // Create an AutoPaginatable instance with the initial page data and a fetch function for loading more pages
    return new AutoPaginatable(
      result as unknown as List<QueryResult>,
      async (params: PaginationOptions) => {
        const nextPage = await fetchAndDeserialize<QueryResultResponse, QueryResult>(
          this.workos,
          "/fga/v1/query",
          deserializer,
          params,
          requestOptions as any,
        );
        return nextPage as unknown as List<QueryResult>;
      },
      serializeQueryOptions(options),
    );
  }
}
