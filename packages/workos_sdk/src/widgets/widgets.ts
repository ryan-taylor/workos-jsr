import { deserializeEmbedUrl } from "./serializers/embed-url.serializer.ts";
import { serializeEmbedOptions } from "./serializers/embed-options.serializer.ts";
import type { EmbedOptions, EmbedUrl } from "./interfaces/index.ts";
import type { WorkOS } from "../workos.ts";

export class Widgets {
  constructor(private workos: WorkOS) {}

  async generateEmbedUrl(options: EmbedOptions): Promise<EmbedUrl> {
    const { data } = await this.workos.post<Record<string, unknown>>(
      "/widgets/embed_url",
      serializeEmbedOptions(options),
    );
    return deserializeEmbedUrl(data);
  }
}
