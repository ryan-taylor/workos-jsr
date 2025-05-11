import type {
  CreatePasswordResetOptions,
  SerializedCreatePasswordResetOptions,
} from "../interfaces.ts";

export const serializeCreatePasswordResetOptions = (
  options: CreatePasswordResetOptions,
): SerializedCreatePasswordResetOptions => ({
  email: options.email,
});
