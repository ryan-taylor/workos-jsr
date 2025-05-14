// Re-export types from the new location for backward compatibility with tests
import { WarrantOp as NewWarrantOp } from "../../../packages/workos_sdk/src/fga/interfaces/warrant-op.enum.ts";

// Export the same enum type to ensure compatibility
export enum WarrantOp {
  Create = "create",
  Delete = "delete",
}

// Add CheckOp enum which is needed by some tests
export enum CheckOp {
  AnyOf = "any_of",
  AllOf = "all_of",
}

// Export other types that might be needed by tests
export type {
  ListWarrantsOptions,
  PolicyContext,
  Subject,
  Warrant,
  WriteWarrantOptions,
} from "../../../packages/workos_sdk/src/fga/interfaces/warrant.interface.ts";
