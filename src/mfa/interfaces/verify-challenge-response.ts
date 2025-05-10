import { Challenge, ChallengeResponse } from './challenge.interface.ts';

export interface VerifyResponse {
  challenge: Challenge;
  valid: boolean;
}

export interface VerifyResponseResponse {
  challenge: ChallengeResponse;
  valid: boolean;
}
