import type { EmbedUrl } from "../interfaces/index.ts";

export function deserializeEmbedUrl(data: Record<string, unknown>): EmbedUrl {
  return {
    url: data.url as string,
  };
}
