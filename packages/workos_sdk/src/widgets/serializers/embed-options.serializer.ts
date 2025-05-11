import type { EmbedOptions } from '../interfaces/index.ts';

export function serializeEmbedOptions(options: EmbedOptions): Record<string, unknown> {
  return {
    organization_id: options.organization_id,
    intent: options.intent,
    return_url: options.return_url,
    state: options.state,
  };
}