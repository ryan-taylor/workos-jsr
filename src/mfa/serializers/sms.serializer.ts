import type { Sms, SmsResponse } from '../interfaces.ts';

export const deserializeSms = (sms: SmsResponse): Sms => ({
  phoneNumber: sms.phone_number,
});
