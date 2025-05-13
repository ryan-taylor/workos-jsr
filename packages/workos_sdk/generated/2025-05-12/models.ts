// Generated TypeScript interfaces for OpenAPI schema

export interface DirectoriesResponse {
  data: Models.Directory[];
  list_metadata: Models.ListMetadata;
}

export interface Directory {
  id: string;
  name: string;
  type: 'okta' | 'azure_scim' | 'google_workspace' | 'generic_scim';
  state: 'active' | 'inactive' | 'validating' | 'error';
  domain?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface ListMetadata {
  before: string;
  after: string;
}

export interface Error {
  code: string;
  message: string;
}

