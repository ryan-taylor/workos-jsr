import type {
  ResetPasswordOptions,
  SerializedResetPasswordOptions,
} from "../interfaces.ts";

export const serializeResetPasswordOptions = (
  options: ResetPasswordOptions,
): SerializedResetPasswordOptions => ({
  token: options.token,
  new_password: options.newPassword,
});
