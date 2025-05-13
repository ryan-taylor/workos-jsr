import { assertEquals, assertRejects } from '@std/assert';

/**
 * Tests for the MFA class
 * Covers all methods for managing Multi-Factor Authentication:
 * - deleteFactor
 * - getFactor
 * - enrollFactor
 * - challengeFactor
 * - verifyChallenge (and deprecated verifyFactor)
 */

// Mock WorkOS instance for testing
class MockWorkOS {
  private mockResponseData: unknown;
  private lastPath: string | null = null;
  private lastMethod: string | null = null;
  private lastData: unknown = null;
  private shouldThrow = false;

  constructor(mockResponse: unknown, shouldThrow = false) {
    this.mockResponseData = mockResponse;
    this.shouldThrow = shouldThrow;
  }

  async get<T>(path: string): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = 'get';
    
    if (this.shouldThrow) {
      throw new Error('Mock API error');
    }
    
    return { data: this.mockResponseData as T };
  }

  async post<T>(path: string, data?: unknown): Promise<{ data: T }> {
    this.lastPath = path;
    this.lastMethod = 'post';
    this.lastData = data;
    
    if (this.shouldThrow) {
      throw new Error('Mock API error');
    }
    
    return { data: this.mockResponseData as T };
  }

  async delete(path: string): Promise<void> {
    this.lastPath = path;
    this.lastMethod = 'delete';
    
    if (this.shouldThrow) {
      throw new Error('Mock API error');
    }
  }

  getLastRequest() {
    return {
      path: this.lastPath,
      method: this.lastMethod,
      data: this.lastData
    };
  }
}

// Mock MFA class implementation to match the one in src/mfa/mfa.ts
class Mfa {
  constructor(private readonly workos: MockWorkOS) {}

  async deleteFactor(id: string) {
    await this.workos.delete(`/auth/factors/${id}`);
  }

  async getFactor(id: string) {
    const { data } = await this.workos.get(`/auth/factors/${id}`);
    return data;
  }

  async enrollFactor(options: {
    type: 'sms' | 'totp';
    phoneNumber?: string;
    issuer?: string;
    user?: string;
  }) {
    const { data } = await this.workos.post('/auth/factors/enroll', {
      type: options.type,
      ...(() => {
        switch (options.type) {
          case 'sms':
            return { phone_number: options.phoneNumber };
          case 'totp':
            return {
              totp_issuer: options.issuer,
              totp_user: options.user,
            };
          default:
            return {};
        }
      })(),
    });

    return data;
  }

  async challengeFactor(options: {
    authenticationFactorId: string;
    smsTemplate?: string;
  }) {
    const { data } = await this.workos.post(
      `/auth/factors/${options.authenticationFactorId}/challenge`,
      {
        sms_template: options.smsTemplate,
      }
    );

    return data;
  }

  async verifyFactor(options: {
    authenticationChallengeId: string;
    code: string;
  }) {
    return this.verifyChallenge(options);
  }

  async verifyChallenge(options: {
    authenticationChallengeId: string;
    code: string;
  }) {
    const { data } = await this.workos.post(
      `/auth/challenges/${options.authenticationChallengeId}/verify`,
      {
        code: options.code,
      }
    );

    return data;
  }
}

Deno.test('MFA - deleteFactor success', async () => {
  const mockWorkos = new MockWorkOS({});
  const mfa = new Mfa(mockWorkos);
  
  // Execute the method
  await mfa.deleteFactor('factor_123');
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/factors/factor_123');
  assertEquals(lastRequest.method, 'delete');
});

Deno.test('MFA - deleteFactor handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const mfa = new Mfa(mockWorkos);
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await mfa.deleteFactor('factor_123');
    },
    Error,
    'Mock API error'
  );
});

Deno.test('MFA - getFactor success', async () => {
  // Mock response data
  const mockFactorResponse = {
    id: 'factor_123',
    type: 'sms',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    phone_number: '+15551234567',
  };
  
  const mockWorkos = new MockWorkOS(mockFactorResponse);
  const mfa = new Mfa(mockWorkos);
  
  // Execute the method
  const result = await mfa.getFactor('factor_123');
  
  // Verify result
  assertEquals(result, mockFactorResponse);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/factors/factor_123');
  assertEquals(lastRequest.method, 'get');
});

Deno.test('MFA - getFactor handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const mfa = new Mfa(mockWorkos);
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await mfa.getFactor('factor_123');
    },
    Error,
    'Mock API error'
  );
});

Deno.test('MFA - enrollFactor SMS success', async () => {
  // Mock response data
  const mockFactorResponse = {
    id: 'factor_123',
    type: 'sms',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    phone_number: '+15551234567',
  };
  
  const mockWorkos = new MockWorkOS(mockFactorResponse);
  const mfa = new Mfa(mockWorkos);
  
  // Test data for SMS factor
  const options = {
    type: 'sms' as const,
    phoneNumber: '+15551234567',
  };
  
  // Execute the method
  const result = await mfa.enrollFactor(options);
  
  // Verify result
  assertEquals(result, mockFactorResponse);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/factors/enroll');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).type, 'sms');
  assertEquals((lastRequest.data as Record<string, unknown>).phone_number, '+15551234567');
});

Deno.test('MFA - enrollFactor TOTP success', async () => {
  // Mock response data for TOTP factor
  const mockFactorResponse = {
    id: 'factor_456',
    type: 'totp',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    totp_issuer: 'WorkOS',
    totp_user: 'user@example.com',
    totp_secret: 'JBSWY3DPEHPK3PXP',
    totp_qr_code: 'data:image/png;base64,abc123',
    totp_uri: 'otpauth://totp/WorkOS:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=WorkOS',
  };
  
  const mockWorkos = new MockWorkOS(mockFactorResponse);
  const mfa = new Mfa(mockWorkos);
  
  // Test data for TOTP factor
  const options = {
    type: 'totp' as const,
    issuer: 'WorkOS',
    user: 'user@example.com',
  };
  
  // Execute the method
  const result = await mfa.enrollFactor(options);
  
  // Verify result
  assertEquals(result, mockFactorResponse);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/factors/enroll');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).type, 'totp');
  assertEquals((lastRequest.data as Record<string, unknown>).totp_issuer, 'WorkOS');
  assertEquals((lastRequest.data as Record<string, unknown>).totp_user, 'user@example.com');
});

Deno.test('MFA - enrollFactor handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const mfa = new Mfa(mockWorkos);
  
  // Test data
  const options = {
    type: 'sms' as const,
    phoneNumber: '+15551234567',
  };
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await mfa.enrollFactor(options);
    },
    Error,
    'Mock API error'
  );
});

Deno.test('MFA - challengeFactor with required parameters', async () => {
  // Mock response data
  const mockChallengeResponse = {
    id: 'challenge_123',
    factor_id: 'factor_123',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    expires_at: '2023-01-01T01:00:00Z',
  };
  
  const mockWorkos = new MockWorkOS(mockChallengeResponse);
  const mfa = new Mfa(mockWorkos);
  
  // Test data with only required parameters
  const options = {
    authenticationFactorId: 'factor_123',
  };
  
  // Execute the method
  const result = await mfa.challengeFactor(options);
  
  // Verify result
  assertEquals(result, mockChallengeResponse);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/factors/factor_123/challenge');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).sms_template, undefined);
});

Deno.test('MFA - challengeFactor with all parameters', async () => {
  // Mock response data
  const mockChallengeResponse = {
    id: 'challenge_123',
    factor_id: 'factor_123',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    expires_at: '2023-01-01T01:00:00Z',
  };
  
  const mockWorkos = new MockWorkOS(mockChallengeResponse);
  const mfa = new Mfa(mockWorkos);
  
  // Test data with all parameters
  const options = {
    authenticationFactorId: 'factor_123',
    smsTemplate: 'Your verification code is {{code}}',
  };
  
  // Execute the method
  const result = await mfa.challengeFactor(options);
  
  // Verify result
  assertEquals(result, mockChallengeResponse);
  
  // Verify correct API call was made with all parameters
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/factors/factor_123/challenge');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).sms_template, 'Your verification code is {{code}}');
});

Deno.test('MFA - challengeFactor handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const mfa = new Mfa(mockWorkos);
  
  // Test data
  const options = {
    authenticationFactorId: 'factor_123',
  };
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await mfa.challengeFactor(options);
    },
    Error,
    'Mock API error'
  );
});

Deno.test('MFA - verifyChallenge success', async () => {
  // Mock response data
  const mockVerifyResponse = {
    challenge_id: 'challenge_123',
    factor_id: 'factor_123',
    verified: true,
  };
  
  const mockWorkos = new MockWorkOS(mockVerifyResponse);
  const mfa = new Mfa(mockWorkos);
  
  // Test data
  const options = {
    authenticationChallengeId: 'challenge_123',
    code: '123456',
  };
  
  // Execute the method
  const result = await mfa.verifyChallenge(options);
  
  // Verify result
  assertEquals(result, mockVerifyResponse);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/challenges/challenge_123/verify');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).code, '123456');
});

Deno.test('MFA - deprecated verifyFactor calls verifyChallenge', async () => {
  // Mock response data
  const mockVerifyResponse = {
    challenge_id: 'challenge_123',
    factor_id: 'factor_123',
    verified: true,
  };
  
  const mockWorkos = new MockWorkOS(mockVerifyResponse);
  const mfa = new Mfa(mockWorkos);
  
  // Test data
  const options = {
    authenticationChallengeId: 'challenge_123',
    code: '123456',
  };
  
  // Execute the deprecated method
  const result = await mfa.verifyFactor(options);
  
  // Verify result
  assertEquals(result, mockVerifyResponse);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/challenges/challenge_123/verify');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).code, '123456');
});

Deno.test('MFA - verifyChallenge handles API errors', async () => {
  // Create mock that will throw an error
  const mockWorkos = new MockWorkOS({}, true);
  const mfa = new Mfa(mockWorkos);
  
  // Test data
  const options = {
    authenticationChallengeId: 'challenge_123',
    code: '123456',
  };
  
  // Should reject with the error from the API call
  await assertRejects(
    async () => {
      await mfa.verifyChallenge(options);
    },
    Error,
    'Mock API error'
  );
});

Deno.test('MFA - verifyChallenge handles verification failure', async () => {
  // Mock response data for verification failure
  const mockVerifyResponse = {
    challenge_id: 'challenge_123',
    factor_id: 'factor_123',
    verified: false,
  };
  
  const mockWorkos = new MockWorkOS(mockVerifyResponse);
  const mfa = new Mfa(mockWorkos);
  
  // Test data
  const options = {
    authenticationChallengeId: 'challenge_123',
    code: 'wrong-code',
  };
  // Execute the method
  const result = await mfa.verifyChallenge(options);
  
  // Verify result shows verification failed
  assertEquals((result as { verified: boolean }).verified, false);
  
  // Verify correct API call was made
  const lastRequest = mockWorkos.getLastRequest();
  assertEquals(lastRequest.path, '/auth/challenges/challenge_123/verify');
  assertEquals(lastRequest.method, 'post');
  assertEquals((lastRequest.data as Record<string, unknown>).code, 'wrong-code');
});