import type { PasswordReset, PasswordResetEvent, PasswordResetEventResponse, PasswordResetResponse } from '../interfaces.ts.ts';

export const deserializePasswordReset = (
  passwordReset: PasswordResetResponse,
): PasswordReset => ({
  object: passwordReset.object,
  id: passwordReset.id,
  userId: passwordReset.user_id,
  email: passwordReset.email,
  passwordResetToken: passwordReset.password_reset_token,
  passwordResetUrl: passwordReset.password_reset_url,
  expiresAt: passwordReset.expires_at,
  createdAt: passwordReset.created_at,
});

export const deserializePasswordResetEvent = (
  passwordReset: PasswordResetEventResponse,
): PasswordResetEvent => ({
  object: passwordReset.object,
  id: passwordReset.id,
  userId: passwordReset.user_id,
  email: passwordReset.email,
  expiresAt: passwordReset.expires_at,
  createdAt: passwordReset.created_at,
});
