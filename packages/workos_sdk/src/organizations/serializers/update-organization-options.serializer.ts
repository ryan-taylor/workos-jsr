import type { UpdateOrganizationOptions } from '../interfaces';

export function serializeUpdateOrganizationOptions(options: UpdateOrganizationOptions): Record<string, unknown> {
  return {
    name: options.name,
    domains: options.domains,
  };
}