export * from "./authorization-model.interface.ts";
export * from "./create-model-options.interface.ts";
export * from "./list-models-options.interface.ts";
export * from "./resource-op.enum.ts";
export * from "./resource.interface.ts";
export * from "./warrant-op.enum.ts";
export * from "./warrant.interface.ts";
export * from "./query.interface.ts";

// Export check interfaces but rename our version to avoid conflicts
export * from "./check-options.interface.ts";
export type {
  CheckBatchOptions as V2CheckBatchOptions,
  CheckItem as V2CheckItem,
  CheckOptions as V2CheckOptions,
  CheckRequestOptions as V2CheckRequestOptions,
  CheckResultResponse as V2CheckResultResponse,
  SerializedCheckBatchOptions as V2SerializedCheckBatchOptions,
  SerializedCheckItem as V2SerializedCheckItem,
  SerializedCheckOptions as V2SerializedCheckOptions,
} from "./check.interface.ts";

// Export the CheckResult class directly since it's not just a type
export { CheckResult as V2CheckResult } from "./check.interface.ts";
