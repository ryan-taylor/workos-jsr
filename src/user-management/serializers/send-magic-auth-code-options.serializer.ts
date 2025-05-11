import type { SendMagicAuthCodeOptions, SerializedSendMagicAuthCodeOptions } from '../interfaces.ts.ts';

export const serializeSendMagicAuthCodeOptions = (
  options: SendMagicAuthCodeOptions,
): SerializedSendMagicAuthCodeOptions => ({
  email: options.email,
});
