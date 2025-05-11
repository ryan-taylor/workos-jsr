import { deserializePortalLink } from "./serializers/portal-link.serializer.ts";
import { serializeGenerateLinkOptions } from "./serializers/generate-link-options.serializer.ts";
import type { GenerateLinkOptions, PortalLink } from "./interfaces";
import { fetchAndDeserialize } from "../common/utils/fetch-and-deserialize.ts";

export class Portal {
  constructor(private apiKey: string) {}

  async generateLink(options: GenerateLinkOptions): Promise<PortalLink> {
    return await fetchAndDeserialize({
      path: "/portal/generate_link",
      method: "POST",
      data: serializeGenerateLinkOptions(options),
      deserializer: deserializePortalLink,
      apiKey: this.apiKey,
    });
  }
}
