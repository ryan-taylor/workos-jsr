import type {
  SerializedUpdateUserOptions,
  UpdateUserOptions,
} from "../interfaces.ts.ts";

export const serializeUpdateUserOptions = (
  options: UpdateUserOptions,
): SerializedUpdateUserOptions => ({
  first_name: options.firstName,
  last_name: options.lastName,
  email_verified: options.emailVerified,
  password: options.password,
  password_hash: options.passwordHash,
  password_hash_type: options.passwordHashType,
  external_id: options.externalId,
  metadata: options.metadata,
});
