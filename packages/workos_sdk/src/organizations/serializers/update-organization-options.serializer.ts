import type { UpdateOrganizationOptions } from "workos/organizations/interfaces.ts";

export function serializeUpdateOrganizationOptions(
  options: UpdateOrganizationOptions,
): Record<string, unknown> {
  return {
    name: options.name,
    domains: options.domains,
  };
}
