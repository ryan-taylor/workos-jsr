import type {
  SerializedUpdateUserPasswordOptions,
  UpdateUserPasswordOptions,
} from "../interfaces/update-user-password-options.interface.ts";

export type { SerializedUpdateUserPasswordOptions, UpdateUserPasswordOptions };

export const serializeUpdateUserPasswordOptions = (
  options: UpdateUserPasswordOptions,
): SerializedUpdateUserPasswordOptions => ({
  password: options.password,
  // userId is not included in serialized output
});
