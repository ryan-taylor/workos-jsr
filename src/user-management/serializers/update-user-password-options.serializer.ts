import type {
  SerializedUpdateUserPasswordOptions,
  UpdateUserPasswordOptions,
} from "../interfaces.ts.ts";

export const serializeUpdateUserPasswordOptions = (
  options: UpdateUserPasswordOptions,
): SerializedUpdateUserPasswordOptions => ({
  password: options.password,
});
