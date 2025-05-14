import type {
  ResetPasswordOptions,
  SerializedResetPasswordOptions,
} from "../interfaces/index.ts";

export const serializeResetPasswordOptions = (
  options: ResetPasswordOptions,
): SerializedResetPasswordOptions => ({
  token: options.token,
  new_password: options.newPassword,
});
