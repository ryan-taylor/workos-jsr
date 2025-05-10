import {
  Factor,
  FactorResponse,
  FactorWithSecrets,
  FactorWithSecretsResponse,
} from '../interfaces.ts';
import { deserializeSms } from './sms.serializer.ts';
import { deserializeTotp, deserializeTotpWithSecrets } from './totp.serializer.ts';

export const deserializeFactor = (factor: FactorResponse): Factor => ({
  object: factor.object,
  id: factor.id,
  createdAt: factor.created_at,
  updatedAt: factor.updated_at,
  type: factor.type,
  ...(factor.sms ? { sms: deserializeSms(factor.sms) } : {}),
  ...(factor.totp ? { totp: deserializeTotp(factor.totp) } : {}),
});

export const deserializeFactorWithSecrets = (
  factor: FactorWithSecretsResponse,
): FactorWithSecrets => ({
  object: factor.object,
  id: factor.id,
  createdAt: factor.created_at,
  updatedAt: factor.updated_at,
  type: factor.type,
  ...(factor.sms ? { sms: deserializeSms(factor.sms) } : {}),
  ...(factor.totp ? { totp: deserializeTotpWithSecrets(factor.totp) } : {}),
});
