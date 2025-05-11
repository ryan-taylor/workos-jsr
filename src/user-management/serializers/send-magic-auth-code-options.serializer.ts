import type { SendMagicAuthCodeOptions, SerializedSendMagicAuthCodeOptions } from '../interfaces.ts';

export const serializeSendMagicAuthCodeOptions = (
  options: SendMagicAuthCodeOptions,
): SerializedSendMagicAuthCodeOptions => ({
  email: options.email,
});
