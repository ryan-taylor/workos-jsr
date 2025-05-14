import type { EmbedUrl } from "../interfaces/index.ts";

export function deserializeEmbedUrl(data: unknown): EmbedUrl {
  const record = data as Record<string, unknown>;
  return {
    url: record.url as string,
  };
}
