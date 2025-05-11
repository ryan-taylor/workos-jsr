export interface GetAuthorizationUrlOptions {
  connection_id?: string;
  organization_id?: string;
  provider?: string;
  redirect_uri: string;
  state?: string;
}