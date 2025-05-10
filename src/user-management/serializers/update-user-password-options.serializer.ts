import {
  SerializedUpdateUserPasswordOptions,
  UpdateUserPasswordOptions,
} from '../interfaces.ts';

export const serializeUpdateUserPasswordOptions = (
  options: UpdateUserPasswordOptions,
): SerializedUpdateUserPasswordOptions => ({
  password: options.password,
});
