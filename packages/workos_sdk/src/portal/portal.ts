import { deserializePortalLink } from "./serializers/portal-link.serializer.ts";
import { serializeGenerateLinkOptions } from "./serializers/generate-link-options.serializer.ts";
import type { GenerateLinkOptions, PortalLink } from "./interfaces.ts";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";
import type { WorkOS } from "../workos.ts";

export class Portal {
  constructor(private readonly workos: WorkOS) {}

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
