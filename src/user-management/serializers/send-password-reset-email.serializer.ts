import type {
  SendPasswordResetEmailOptions,
  SerializedSendPasswordResetEmailOptions,
} from "../interfaces.ts";

export const serializeSendPasswordResetEmailOptions = (
  options: SendPasswordResetEmailOptions,
): SerializedSendPasswordResetEmailOptions => ({
  email: options.email,
  password_reset_url: options.passwordResetUrl,
});
