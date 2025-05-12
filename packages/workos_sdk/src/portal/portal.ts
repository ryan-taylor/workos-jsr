import { deserializePortalLink } from "./serializers/portal-link.serializer.ts";
import { serializeGenerateLinkOptions } from "./serializers/generate-link-options.serializer.ts";
import type { GenerateLinkOptions, PortalLink } from "./interfaces.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";

/**
 * Service for generating WorkOS Admin Portal links.
 * 
 * The Admin Portal provides a pre-built interface for organization administrators to configure 
 * WorkOS features like SSO, Directory Sync, and Audit Logs without requiring custom UI development.
 * 
 * @example
 * ```ts
 * // Generate a link to the SSO configuration portal
 * const { link } = await workos.portal.generateLink({
 *   organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
 *   intent: 'sso',
 *   return_url: 'https://example.com/settings'
 * });
 * 
 * // Redirect the user to the generated link
 * Response.redirect(link);
 * ```
 */
export class Portal {
  constructor(private readonly workos: WorkOS) {}

  /**
   * Generates an admin portal link for a specific organization.
   * 
   * @param options - Configuration options for generating the portal link
   * @returns Promise resolving to an object containing the portal link
   * 
   * @example
   * ```ts
   * // Generate a link to the Directory Sync configuration portal
   * const { link } = await workos.portal.generateLink({
   *   organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
   *   intent: 'dsync'
   * });
   * 
   * // The link can be provided to organization administrators
   * console.log(`Configure your directory sync settings: ${link}`);
   * ```
   */
  async generateLink(options: GenerateLinkOptions): Promise<PortalLink> {
    const result = await fetchAndDeserialize<Record<string, unknown>, PortalLink>({
      workos: this.workos,
      path: "/portal/generate_link",
      method: "POST",
      data: serializeGenerateLinkOptions(options),
      deserializer: deserializePortalLink,
    });

    if (Array.isArray(result)) {
      return result[0];
    }

    return result as PortalLink;
  }
}
