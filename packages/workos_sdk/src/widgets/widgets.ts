import { deserializeEmbedUrl } from "./serializers/embed-url.serializer.ts";
import { serializeEmbedOptions } from "./serializers/embed-options.serializer.ts";
import type { EmbedOptions, EmbedUrl } from "./interfaces/index.ts";
import type { WorkOS } from "../workos.ts";

/**
 * Service for WorkOS Widgets, such as pre-built UI embed URLs.
 *
 * The Widgets API allows you to generate URLs to embed WorkOS features directly in your UI,
 * such as admin dashboards, consent forms, and more.
 *
 * @example
 * ```ts
 * const embedUrl = await workos.widgets.generateEmbedUrl({
 *   type: 'Consent',
 *   session_token: 'token_123'
 * });
 * window.location.href = embedUrl.url;
 * ```
 */
export class Widgets {
  /**
   * @param workos - The main WorkOS client instance
   */
  constructor(private workos: WorkOS) {}

  /**
   * Generates an embed URL for WorkOS widgets.
   *
   * @param options - Configuration options for the embed URL
   * @returns Promise resolving to an EmbedUrl object
   */
  async generateEmbedUrl(options: EmbedOptions): Promise<EmbedUrl> {
    const { data } = await this.workos.post<Record<string, unknown>>(
      "/widgets/embed_url",
      serializeEmbedOptions(options),
    );
    return deserializeEmbedUrl(data);
  }
}
