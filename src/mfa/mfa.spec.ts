// Import Deno standard testing library
import { assertEquals } from '@std/assert';

import { fetchBody, fetchOnce, fetchURL, resetMockFetch } from '../common/utils/test-utils.ts';
import { UnprocessableEntityException } from '../common/exceptions/unprocessable-entity.exception.ts';

import { WorkOS } from '../workos.ts';
import type {
  Challenge,
  ChallengeResponse,
  Factor,
  FactorResponse,
  FactorWithSecrets,
  FactorWithSecretsResponse,
  VerifyResponse,
  VerifyResponseResponse,
} from './interfaces/index.ts';

// Setup function to reset mock fetch before each test
function setup() {
  resetMockFetch();
}

// MFA - getFactor
Deno.test('MFA - returns the requested factor', async () => {
  setup();
  
  const factor: Factor = {
    object: 'authentication_factor',
    id: 'auth_factor_1234',
    createdAt: '2022-03-15T20:39:19.892Z',
    updatedAt: '2022-03-15T20:39:19.892Z',
    type: 'totp',
    totp: {
      issuer: 'WorkOS',
      user: 'some_user',
    },
  };

  const factorResponse: FactorResponse = {
    object: 'authentication_factor',
    id: 'auth_factor_1234',
    created_at: '2022-03-15T20:39:19.892Z',
    updated_at: '2022-03-15T20:39:19.892Z',
    type: 'totp',
    totp: {
      issuer: 'WorkOS',
      user: 'some_user',
    },
  };

  fetchOnce(JSON.stringify(factorResponse));

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
  const subject = await workos.mfa.getFactor('test_123');

  assertEquals(subject, factor);
});

// MFA - deleteFactor
Deno.test('MFA - sends request to delete a Factor', async () => {
  setup();
  
  fetchOnce();
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  await workos.mfa.deleteFactor('conn_123');

  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/auth/factors/conn_123'), true);
});

// MFA - enrollFactor with generic
Deno.test('MFA - enrolls a factor with generic type', async () => {
  setup();
  
  const factor: Factor = {
    object: 'authentication_factor',
    id: 'auth_factor_1234',
    createdAt: '2022-03-15T20:39:19.892Z',
    updatedAt: '2022-03-15T20:39:19.892Z',
    type: 'generic_otp',
  };

  const factorResponse: FactorResponse = {
    object: 'authentication_factor',
    id: 'auth_factor_1234',
    created_at: '2022-03-15T20:39:19.892Z',
    updated_at: '2022-03-15T20:39:19.892Z',
    type: 'generic_otp',
  };

  fetchOnce(JSON.stringify(factorResponse));

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const subject = await workos.mfa.enrollFactor({
    type: 'generic_otp',
  });

  assertEquals(subject, factor);
});

// MFA - enrollFactor with totp
Deno.test('MFA - enrolls a factor with totp type', async () => {
  setup();
  
  const factor: FactorWithSecrets = {
    object: 'authentication_factor',
    id: 'auth_factor_1234',
    createdAt: '2022-03-15T20:39:19.892Z',
    updatedAt: '2022-03-15T20:39:19.892Z',
    type: 'totp',
    totp: {
      issuer: 'WorkOS',
      qrCode: 'qr-code-test',
      secret: 'secret-test',
      uri: 'uri-test',
      user: 'some_user',
    },
  };

  const factorResponse: FactorWithSecretsResponse = {
    object: 'authentication_factor',
    id: 'auth_factor_1234',
    created_at: '2022-03-15T20:39:19.892Z',
    updated_at: '2022-03-15T20:39:19.892Z',
    type: 'totp',
    totp: {
      issuer: 'WorkOS',
      qr_code: 'qr-code-test',
      secret: 'secret-test',
      uri: 'uri-test',
      user: 'some_user',
    },
  };

  fetchOnce(JSON.stringify(factorResponse));
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const subject = await workos.mfa.enrollFactor({
    type: 'totp',
    issuer: 'WorkOS',
    user: 'some_user',
  });

  assertEquals(subject, factor);
});

// MFA - enrollFactor with sms
Deno.test('MFA - enrolls a factor with sms type', async () => {
  setup();
  
  const factor: Factor = {
    object: 'authentication_factor',
    id: 'auth_factor_1234',
    createdAt: '2022-03-15T20:39:19.892Z',
    updatedAt: '2022-03-15T20:39:19.892Z',
    type: 'sms',
    sms: {
      phoneNumber: '+15555555555',
    },
  };

  const factorResponse: FactorResponse = {
    object: 'authentication_factor',
    id: 'auth_factor_1234',
    created_at: '2022-03-15T20:39:19.892Z',
    updated_at: '2022-03-15T20:39:19.892Z',
    type: 'sms',
    sms: {
      phone_number: '+15555555555',
    },
  };

  fetchOnce(JSON.stringify(factorResponse));

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const subject = await workos.mfa.enrollFactor({
    type: 'sms',
    phoneNumber: '+1555555555',
  });

  assertEquals(subject, factor);
});

// MFA - enrollFactor with invalid phone number
Deno.test('MFA - throws exception when phone number is invalid', async () => {
  setup();
  
  fetchOnce(
    JSON.stringify({
      message: `Phone number is invalid: 'foo'`,
      code: 'invalid_phone_number',
    }),
    {
      status: 422,
      headers: { 'X-Request-ID': 'req_123' },
    },
  );

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  try {
    await workos.mfa.enrollFactor({
      type: 'sms',
      phoneNumber: 'foo',
    });
    throw new Error('Expected to throw but did not');
  } catch (error) {
    assertEquals(error instanceof UnprocessableEntityException, true);
  }
});

// MFA - challengeFactor with no sms template
Deno.test('MFA - challenge a factor with no sms template', async () => {
  setup();
  
  const challenge: Challenge = {
    object: 'authentication_challenge',
    id: 'auth_challenge_1234',
    createdAt: '2022-03-15T20:39:19.892Z',
    updatedAt: '2022-03-15T20:39:19.892Z',
    expiresAt: '2022-03-15T21:39:19.892Z',
    code: '12345',
    authenticationFactorId: 'auth_factor_1234',
  };

  const challengeResponse: ChallengeResponse = {
    object: 'authentication_challenge',
    id: 'auth_challenge_1234',
    created_at: '2022-03-15T20:39:19.892Z',
    updated_at: '2022-03-15T20:39:19.892Z',
    expires_at: '2022-03-15T21:39:19.892Z',
    code: '12345',
    authentication_factor_id: 'auth_factor_1234',
  };

  fetchOnce(JSON.stringify(challengeResponse));

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const subject = await workos.mfa.challengeFactor({
    authenticationFactorId: 'auth_factor_1234',
  });

  assertEquals(subject, challenge);
});

// MFA - challengeFactor with sms template
Deno.test('MFA - challenge a factor with sms template', async () => {
  setup();
  
  const challenge: Challenge = {
    object: 'authentication_challenge',
    id: 'auth_challenge_1234',
    createdAt: '2022-03-15T20:39:19.892Z',
    updatedAt: '2022-03-15T20:39:19.892Z',
    expiresAt: '2022-03-15T21:39:19.892Z',
    code: '12345',
    authenticationFactorId: 'auth_factor_1234',
  };

  const challengeResponse: ChallengeResponse = {
    object: 'authentication_challenge',
    id: 'auth_challenge_1234',
    created_at: '2022-03-15T20:39:19.892Z',
    updated_at: '2022-03-15T20:39:19.892Z',
    expires_at: '2022-03-15T21:39:19.892Z',
    code: '12345',
    authentication_factor_id: 'auth_factor_1234',
  };

  fetchOnce(JSON.stringify(challengeResponse));

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const subject = await workos.mfa.challengeFactor({
    authenticationFactorId: 'auth_factor_1234',
    smsTemplate: 'This is your code: 12345',
  });

  const body = fetchBody();
  assertEquals(body, {
    sms_template: 'This is your code: 12345',
  });
  assertEquals(subject, challenge);
});

// MFA - verifyChallenge with successful response
Deno.test('MFA - verifies a successful factor', async () => {
  setup();
  
  const verifyResponse: VerifyResponse = {
    challenge: {
      object: 'authentication_challenge',
      id: 'auth_challenge_1234',
      createdAt: '2022-03-15T20:39:19.892Z',
      updatedAt: '2022-03-15T20:39:19.892Z',
      expiresAt: '2022-03-15T21:39:19.892Z',
      code: '12345',
      authenticationFactorId: 'auth_factor_1234',
    },
    valid: true,
  };

  const verifyResponseResponse: VerifyResponseResponse = {
    challenge: {
      object: 'authentication_challenge',
      id: 'auth_challenge_1234',
      created_at: '2022-03-15T20:39:19.892Z',
      updated_at: '2022-03-15T20:39:19.892Z',
      expires_at: '2022-03-15T21:39:19.892Z',
      code: '12345',
      authentication_factor_id: 'auth_factor_1234',
    },
    valid: true,
  };

  fetchOnce(JSON.stringify(verifyResponseResponse));

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const subject = await workos.mfa.verifyChallenge({
    authenticationChallengeId: 'auth_challenge_1234',
    code: '12345',
  });

  const body = fetchBody();
  assertEquals(body, {
    code: '12345',
  });
  assertEquals(subject, verifyResponse);
});

// MFA - verifyChallenge when the challenge has been previously verified
Deno.test('MFA - throws exception when the challenge has been previously verified', async () => {
  setup();
  
  fetchOnce(
    JSON.stringify({
      message: `The authentication challenge '12345' has already been verified.`,
      code: 'authentication_challenge_previously_verified',
    }),
    {
      status: 422,
      headers: { 'X-Request-ID': 'req_123' },
    },
  );

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  try {
    await workos.mfa.verifyChallenge({
      authenticationChallengeId: 'auth_challenge_1234',
      code: '12345',
    });
    throw new Error('Expected to throw but did not');
  } catch (error) {
    assertEquals(error instanceof UnprocessableEntityException, true);
  }
  
  const body = fetchBody();
  assertEquals(body, {
    code: '12345',
  });
});

// MFA - verifyChallenge when the challenge has expired
Deno.test('MFA - throws exception when the challenge has expired', async () => {
  setup();
  
  fetchOnce(
    JSON.stringify({
      message: `The authentication challenge '12345' has expired.`,
      code: 'authentication_challenge_expired',
    }),
    {
      status: 422,
      headers: { 'X-Request-ID': 'req_123' },
    },
  );

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  try {
    await workos.mfa.verifyChallenge({
      authenticationChallengeId: 'auth_challenge_1234',
      code: '12345',
    });
    throw new Error('Expected to throw but did not');
  } catch (error) {
    assertEquals(error instanceof UnprocessableEntityException, true);
  }
  
  const body = fetchBody();
  assertEquals(body, {
    code: '12345',
  });
});

Deno.test('MFA - exception has code when the challenge has expired', async () => {
  setup();
  
  fetchOnce(
    JSON.stringify({
      message: `The authentication challenge '12345' has expired.`,
      code: 'authentication_challenge_expired',
    }),
    {
      status: 422,
      headers: { 'X-Request-ID': 'req_123' },
    },
  );

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  try {
    await workos.mfa.verifyChallenge({
      authenticationChallengeId: 'auth_challenge_1234',
      code: '12345',
    });
    throw new Error('Expected to throw but did not');
  } catch (error) {
    if (error instanceof UnprocessableEntityException) {
      assertEquals(error.code, 'authentication_challenge_expired');
    }
  }
  
  const body = fetchBody();
  assertEquals(body, {
    code: '12345',
  });
});
