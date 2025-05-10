import {
  PasswordlessSession,
  PasswordlessSessionResponse,
} from '../interfaces.ts';

export const deserializePasswordlessSession = (
  passwordlessSession: PasswordlessSessionResponse,
): PasswordlessSession => ({
  id: passwordlessSession.id,
  email: passwordlessSession.email,
  expiresAt: passwordlessSession.expires_at,
  link: passwordlessSession.link,
  object: passwordlessSession.object,
});
