import {
  type BatchWriteResourcesOptions,
  type CreateResourceOptions,
  type DeleteResourceOptions,
  ResourceOp,
  type SerializedBatchWriteResourcesOptions,
  type SerializedCreateResourceOptions,
  type SerializedDeleteResourceOptions,
} from "../interfaces.ts";
import { serializeCreateResourceOptions } from "./create-resource-options.serializer.ts";
import { serializeDeleteResourceOptions } from "./delete-resource-options.serializer.ts";

export const serializeBatchWriteResourcesOptions = (
  options: BatchWriteResourcesOptions,
): SerializedBatchWriteResourcesOptions => {
  let serializedResources:
    | SerializedCreateResourceOptions[]
    | SerializedDeleteResourceOptions[] = [];
  if (options.op === ResourceOp.Create) {
    const resources = options.resources as CreateResourceOptions[];
    serializedResources = resources.map((options: CreateResourceOptions) =>
      serializeCreateResourceOptions(options)
    );
  } else if (options.op === ResourceOp.Delete) {
    const resources = options.resources as DeleteResourceOptions[];
    serializedResources = resources.map((options: DeleteResourceOptions) =>
      serializeDeleteResourceOptions(options)
    );
  }

  return {
    op: options.op,
    resources: serializedResources,
  };
};
