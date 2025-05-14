import type {
  CreatePasswordResetOptions,
  SerializedCreatePasswordResetOptions,
} from "../interfaces/index.ts";

export const serializeCreatePasswordResetOptions = (
  options: CreatePasswordResetOptions,
): SerializedCreatePasswordResetOptions => ({
  email: options.email,
});
