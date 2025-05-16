import type { PaginationOptions } from "../../common/interfaces/pagination-options.interface.ts";

// Interface for listing organizations with pagination
export interface ListOrganizationsOptions
  extends PaginationOptions, Record<string, unknown> {
  domains?: string[];
}
