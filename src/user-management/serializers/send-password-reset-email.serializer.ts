import type {
  SendPasswordResetEmailOptions,
  SerializedSendPasswordResetEmailOptions,
} from "../interfaces/index.ts";

export const serializeSendPasswordResetEmailOptions = (
  options: SendPasswordResetEmailOptions,
): SerializedSendPasswordResetEmailOptions => ({
  email: options.email,
  password_reset_url: options.passwordResetUrl,
});
