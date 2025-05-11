import type { VerifyResponse, VerifyResponseResponse } from '../interfaces.ts';
import { deserializeChallenge } from './challenge.serializer.ts';

export const deserializeVerifyResponse = (
  verifyResponse: VerifyResponseResponse,
): VerifyResponse => ({
  challenge: deserializeChallenge(verifyResponse.challenge),
  valid: verifyResponse.valid,
});
