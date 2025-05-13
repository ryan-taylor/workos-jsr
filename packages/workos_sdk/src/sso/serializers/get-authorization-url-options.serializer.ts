import type { GetAuthorizationUrlOptions } from "workos/sso/interfaces/index.ts";

export function serializeGetAuthorizationUrlOptions(
  options: GetAuthorizationUrlOptions,
): Record<string, unknown> {
  return {
    connection_id: options.connection_id,
    organization_id: options.organization_id,
    provider: options.provider,
    redirect_uri: options.redirect_uri,
    state: options.state,
  };
}
