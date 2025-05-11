import type { EnrollAuthFactorOptions, SerializedEnrollUserInMfaFactorOptions } from '../interfaces.ts';

export const serializeEnrollAuthFactorOptions = (
  options: EnrollAuthFactorOptions,
): SerializedEnrollUserInMfaFactorOptions => ({
  type: options.type,
  totp_issuer: options.totpIssuer,
  totp_user: options.totpUser,
  totp_secret: options.totpSecret,
});
