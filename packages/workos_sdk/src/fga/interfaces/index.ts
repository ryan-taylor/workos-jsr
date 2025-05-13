export * from "workos/fga/interfaces/authorization-model.interface.ts";
export * from "workos/fga/interfaces/create-model-options.interface.ts";
export * from "workos/fga/interfaces/list-models-options.interface.ts";
export * from "workos/fga/interfaces/resource-op.enum.ts";
export * from "workos/fga/interfaces/resource.interface.ts";
export * from "workos/fga/interfaces/warrant-op.enum.ts";
export * from "workos/fga/interfaces/warrant.interface.ts";
export * from "workos/fga/interfaces/query.interface.ts";

// Export check interfaces but rename our version to avoid conflicts
export * from "workos/fga/interfaces/check-options.interface.ts";
export type { 
  CheckItem as V2CheckItem,
  CheckOptions as V2CheckOptions,
  CheckBatchOptions as V2CheckBatchOptions,
  CheckRequestOptions as V2CheckRequestOptions,
  CheckResultResponse as V2CheckResultResponse,
  SerializedCheckItem as V2SerializedCheckItem,
  SerializedCheckOptions as V2SerializedCheckOptions,
  SerializedCheckBatchOptions as V2SerializedCheckBatchOptions
} from "workos/fga/interfaces/check.interface.ts";

// Export the CheckResult class directly since it's not just a type
export { CheckResult as V2CheckResult } from "workos/fga/interfaces/check.interface.ts";
