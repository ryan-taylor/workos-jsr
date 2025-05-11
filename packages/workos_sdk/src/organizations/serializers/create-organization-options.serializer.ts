import type { CreateOrganizationOptions } from "../interfaces";

export function serializeCreateOrganizationOptions(
  options: CreateOrganizationOptions,
): Record<string, unknown> {
  return {
    name: options.name,
    domains: options.domains,
  };
}
