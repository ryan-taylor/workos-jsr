import type { PaginationOptions } from "../../common/interfaces/pagination-options.interface.ts";

export interface ListDirectoriesOptions extends PaginationOptions {
  organizationId?: string;
  search?: string;
  order?: string;
}

// This interface represents the serialized form of ListDirectoriesOptions
// and should be compatible with Record<string, unknown>
export interface SerializedListDirectoriesOptions
  extends PaginationOptions, Record<string, unknown> {
  organization_id?: string;
  search?: string;
  order?: string;
}
