import type { PaginationOptions } from "../../common/interfaces.ts";
import type { ResourceOp } from "./resource-op.enum.ts";
import type { MetadataMap } from "../../common/interfaces/metadata.interface.ts";

export interface ResourceInterface {
  getResourceType(): string;
  getResourceId(): string;
}

export interface ResourceOptions {
  resourceType: string;
  resourceId?: string;
}

export interface SerializedResourceOptions {
  resource_type: string;
  resource_id?: string;
}

export interface CreateResourceOptions {
  resource: ResourceInterface | ResourceOptions;
  meta?: MetadataMap;
}

export interface SerializedCreateResourceOptions {
  resource_type: string;
  resource_id?: string;
  meta?: MetadataMap;
}

export type GetResourceOptions = ResourceInterface | ResourceOptions;

export interface ListResourcesOptions extends PaginationOptions {
  resourceType?: string;
  search?: string;
}

export interface SerializedListResourcesOptions extends PaginationOptions {
  resource_type?: string;
  search?: string;
}

export interface UpdateResourceOptions {
  resource: ResourceInterface | ResourceOptions;
  meta: MetadataMap;
}

export type DeleteResourceOptions = ResourceInterface | ResourceOptions;

export interface SerializedDeleteResourceOptions {
  resource_type: string;
  resource_id: string;
}

export interface Resource {
  resourceType: string;
  resourceId: string;
  meta?: MetadataMap;
}

export interface ResourceResponse {
  resource_type: string;
  resource_id: string;
  meta?: MetadataMap;
}

export interface BatchWriteResourcesOptions {
  op: ResourceOp;
  resources: CreateResourceOptions[] | DeleteResourceOptions[];
}

export interface SerializedBatchWriteResourcesOptions {
  op: string;
  resources:
    | SerializedCreateResourceOptions[]
    | SerializedDeleteResourceOptions[];
}

export interface BatchWriteResourcesResponse {
  data: ResourceResponse[];
}
