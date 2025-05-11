import type { Identity, IdentityResponse } from '../interfaces/identity.interface.ts.ts';

export const deserializeIdentities = (
  identities: IdentityResponse[],
): Identity[] => {
  return identities.map((identity) => {
    return {
      idpId: identity.idp_id,
      type: identity.type,
      provider: identity.provider,
    };
  });
};
