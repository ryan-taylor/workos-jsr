import type {
  BatchWriteResourcesOptions,
  CreateResourceOptions,
  DeleteResourceOptions,
  SerializedBatchWriteResourcesOptions,
  SerializedCreateResourceOptions,
  SerializedDeleteResourceOptions,
} from "../interfaces/index.ts";
import { ResourceOp } from "../interfaces/index.ts";
import { serializeCreateResourceOptions } from "./create-resource-options.serializer.ts";
import { serializeDeleteResourceOptions } from "./delete-resource-options.serializer.ts";

/**
 * Serializes batch write resources options for the API
 * @param options The batch write resources options
 * @returns The serialized batch write resources options
 */
export const serializeBatchWriteResourcesOptions = (
  options: BatchWriteResourcesOptions,
): SerializedBatchWriteResourcesOptions => {
  const { op, resources } = options;

  if (op === ResourceOp.Create) {
    return {
      op: op.toString(),
      resources: (resources as CreateResourceOptions[]).map(
        (resource) => serializeCreateResourceOptions(resource),
      ),
    };
  } else if (op === ResourceOp.Delete) {
    return {
      op: op.toString(),
      resources: (resources as DeleteResourceOptions[]).map(
        (resource) => serializeDeleteResourceOptions(resource),
      ),
    };
  }

  throw new Error(`Invalid resource operation: ${op}`);
};
