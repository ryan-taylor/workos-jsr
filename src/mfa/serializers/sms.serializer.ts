import type { Sms, SmsResponse } from '../interfaces.ts.ts';

export const deserializeSms = (sms: SmsResponse): Sms => ({
  phoneNumber: sms.phone_number,
});
