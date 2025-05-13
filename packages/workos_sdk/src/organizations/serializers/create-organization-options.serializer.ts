import type { CreateOrganizationOptions } from "workos/organizations/interfaces.ts";

export function serializeCreateOrganizationOptions(
  options: CreateOrganizationOptions,
): Record<string, unknown> {
  return {
    name: options.name,
    domains: options.domains,
  };
}
