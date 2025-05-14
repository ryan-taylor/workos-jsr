import type {
  SendMagicAuthCodeOptions,
  SerializedSendMagicAuthCodeOptions,
} from "../interfaces/index.ts";

export const serializeSendMagicAuthCodeOptions = (
  options: SendMagicAuthCodeOptions,
): SerializedSendMagicAuthCodeOptions => ({
  email: options.email,
});
