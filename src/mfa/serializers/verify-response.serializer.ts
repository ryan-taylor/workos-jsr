import type { VerifyResponse, VerifyResponseResponse } from '../interfaces.ts.ts';
import { deserializeChallenge } from './challenge.serializer.ts.ts';

export const deserializeVerifyResponse = (
  verifyResponse: VerifyResponseResponse,
): VerifyResponse => ({
  challenge: deserializeChallenge(verifyResponse.challenge),
  valid: verifyResponse.valid,
});
