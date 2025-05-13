import type {
  WarrantToken,
  WarrantTokenResponse,
} from "../interfaces/warrant-token.interface.ts.ts";

export const deserializeWarrantToken = (
  warrantToken: WarrantTokenResponse,
): WarrantToken => ({
  warrantToken: warrantToken.warrant_token,
});
