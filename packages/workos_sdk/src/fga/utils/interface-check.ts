import type { ResourceInterface } from "workos/fga/interfaces/resource.interface.ts";

/**
 * Type guard to check if an object implements the ResourceInterface
 * @param obj The object to check
 * @returns True if the object implements ResourceInterface
 */
export function isResourceInterface(obj: any): obj is ResourceInterface {
  return (
    obj &&
    typeof obj.getResourceType === "function" &&
    typeof obj.getResourceId === "function"
  );
}