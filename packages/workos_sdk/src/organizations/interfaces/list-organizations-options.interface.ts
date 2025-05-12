/**
 * Options for retrieving a list of WorkOS Organizations.
 * These options control pagination and filtering of organization results.
 */
export interface ListOrganizationsOptions {
  /** Maximum number of records to return (default and max value set by the API) */
  limit?: number;
  
  /** Pagination cursor to get records before a specific organization ID */
  before?: string;
  
  /** Pagination cursor to get records after a specific organization ID */
  after?: string;
  
  /** Filter organizations by domain (exact match) */
  domain?: string;
}
