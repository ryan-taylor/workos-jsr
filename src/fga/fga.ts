import type { WorkOS } from "@ryantaylor/workos";
import {
  type BatchWriteResourcesOptions,
  type BatchWriteResourcesResponse,
  type CheckBatchOptions,
  type CheckOptions,
  type CheckRequestOptions,
  CheckResult,
  type CheckResultResponse,
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
} from "$sdk/fga/interfaces";
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
} from "$sdk/fga/serializers";
import { isResourceInterface } from "$sdk/fga/utils/interface-check";
import { AutoPaginatable } from "$sdk/common/utils/pagination";
import { fetchAndDeserialize } from "$sdk/common/utils/fetch-and-deserialize";
import type { PaginationOptions } from "$sdk/common/interfaces";

export class FGA {
  constructor(private readonly workos: WorkOS) {}

  check(
    checkOptions: CheckOptions,
    options: CheckRequestOptions = {},
  ): Promise<CheckResult> {
    return this.workos.post<CheckResultResponse>(
      `/fga/v1/check`,
      serializeCheckOptions(checkOptions),
      options,
    ).then(({ data }) => new CheckResult(data));
  }

  checkBatch(
    checkOptions: CheckBatchOptions,
    options: CheckRequestOptions = {},
  ): Promise<CheckResult[]> {
    return this.workos.post<CheckResultResponse[]>(
      `/fga/v1/check`,
      serializeCheckBatchOptions(checkOptions),
      options,
    ).then(({ data }) =>
      data.map(
        (checkResult: CheckResultResponse) => new CheckResult(checkResult)
      )
    );
  }

  async createResource(resource: CreateResourceOptions): Promise<Resource> {
    const { data } = await this.workos.post<ResourceResponse>(
      "/fga/v1/resources",
      serializeCreateResourceOptions(resource),
    );

    return deserializeResource(data);
  }

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

  async listResources(
    options?: ListResourcesOptions,
  ): Promise<AutoPaginatable<Resource>> {
    return new AutoPaginatable(
      await fetchAndDeserialize<ResourceResponse, Resource>(
        this.workos,
        "/fga/v1/resources",
        deserializeResource,
        options ? serializeListResourceOptions(options) : undefined,
      ),
      (params: PaginationOptions) =>
        fetchAndDeserialize<ResourceResponse, Resource>(
          this.workos,
          "/fga/v1/resources",
          deserializeResource,
          params,
        ),
      options ? serializeListResourceOptions(options) : undefined,
    );
  }

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

  async deleteResource(resource: DeleteResourceOptions): Promise<void> {
    const resourceType = isResourceInterface(resource)
      ? resource.getResourceType()
      : resource.resourceType;
    const resourceId = isResourceInterface(resource)
      ? resource.getResourceId()
      : resource.resourceId;

    await this.workos.delete(`/fga/v1/resources/${resourceType}/${resourceId}`);
  }

  async batchWriteResources(
    options: BatchWriteResourcesOptions,
  ): Promise<Resource[]> {
    const { data } = await this.workos.post<BatchWriteResourcesResponse>(
      "/fga/v1/resources/batch",
      serializeBatchWriteResourcesOptions(options),
    );
    return deserializeBatchWriteResourcesResponse(data);
  }

  async writeWarrant(options: WriteWarrantOptions): Promise<WarrantToken> {
    const { data } = await this.workos.post<WarrantTokenResponse>(
      "/fga/v1/warrants",
      serializeWriteWarrantOptions(options),
    );

    return deserializeWarrantToken(data);
  }

  async batchWriteWarrants(
    options: WriteWarrantOptions[],
  ): Promise<WarrantToken> {
    const { data: warrantToken } = await this.workos.post<WarrantTokenResponse>(
      "/fga/v1/warrants",
      options.map(serializeWriteWarrantOptions),
    );

    return deserializeWarrantToken(warrantToken);
  }

  async listWarrants(
    options?: ListWarrantsOptions,
    requestOptions?: ListWarrantsRequestOptions,
  ): Promise<AutoPaginatable<Warrant>> {
    return new AutoPaginatable(
      await fetchAndDeserialize<WarrantResponse, Warrant>(
        this.workos,
        "/fga/v1/warrants",
        deserializeWarrant,
        options ? serializeListWarrantsOptions(options) : undefined,
        requestOptions,
      ),
      (params: PaginationOptions) =>
        fetchAndDeserialize<WarrantResponse, Warrant>(
          this.workos,
          "/fga/v1/warrants",
          deserializeWarrant,
          params,
          requestOptions,
        ),
      options ? serializeListWarrantsOptions(options) : undefined,
    );
  }

  query(
    options: QueryOptions,
    requestOptions: QueryRequestOptions = {},
  ): Promise<AutoPaginatable<QueryResult>> {
    return fetchAndDeserialize<QueryResultResponse, QueryResult>(
      this.workos,
      "/fga/v1/query",
      deserializeQueryResult,
      serializeQueryOptions(options),
      requestOptions,
    ).then(result =>
      new AutoPaginatable(
        result,
        (params: PaginationOptions) =>
          fetchAndDeserialize<QueryResultResponse, QueryResult>(
            this.workos,
            "/fga/v1/query",
            deserializeQueryResult,
            params,
            requestOptions,
          ),
        serializeQueryOptions(options),
      )
    );
  }
}
