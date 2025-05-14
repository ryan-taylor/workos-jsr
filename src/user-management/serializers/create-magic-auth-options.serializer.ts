import type {
  CreateMagicAuthOptions,
  SerializedCreateMagicAuthOptions,
} from "../interfaces/index.ts";

export const serializeCreateMagicAuthOptions = (
  options: CreateMagicAuthOptions,
): SerializedCreateMagicAuthOptions => ({
  email: options.email,
  invitation_token: options.invitationToken,
});
