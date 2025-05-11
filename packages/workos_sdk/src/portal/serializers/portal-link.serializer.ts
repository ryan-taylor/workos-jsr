import type { PortalLink } from "../interfaces";

export function deserializePortalLink(
  data: Record<string, unknown>,
): PortalLink {
  return {
    link: data.link as string,
  };
}
