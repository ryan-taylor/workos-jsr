import type {
  CreateMagicAuthOptions,
  SerializedCreateMagicAuthOptions,
} from "../interfaces.ts";

export const serializeCreateMagicAuthOptions = (
  options: CreateMagicAuthOptions,
): SerializedCreateMagicAuthOptions => ({
  email: options.email,
  invitation_token: options.invitationToken,
});
