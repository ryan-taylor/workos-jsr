import type {
  CreatePasswordResetOptions,
  SerializedCreatePasswordResetOptions,
} from "../interfaces.ts.ts";

export const serializeCreatePasswordResetOptions = (
  options: CreatePasswordResetOptions,
): SerializedCreatePasswordResetOptions => ({
  email: options.email,
});
