import type { Totp, TotpResponse, TotpWithSecrets, TotpWithSecretsResponse } from '../interfaces.ts';

export const deserializeTotp = (totp: TotpResponse): Totp => {
  return {
    issuer: totp.issuer,
    user: totp.user,
  };
};

export const deserializeTotpWithSecrets = (
  totp: TotpWithSecretsResponse,
): TotpWithSecrets => {
  return {
    issuer: totp.issuer,
    user: totp.user,
    qrCode: totp.qr_code,
    secret: totp.secret,
    uri: totp.uri,
  };
};
