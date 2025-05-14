import type { PortalLink } from "../interfaces.ts";

export function deserializePortalLink(data: unknown): PortalLink {
  const record = data as Record<string, unknown>;
  return {
    link: record.link as string,
  };
}
