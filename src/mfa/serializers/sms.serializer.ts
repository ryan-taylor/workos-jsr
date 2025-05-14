import type { Sms, SmsResponse } from "../interfaces/index.ts";

export const deserializeSms = (sms: SmsResponse): Sms => ({
  phoneNumber: sms.phone_number,
});
