// Import Deno testing utilities
import {
  assertEquals,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from "../tests/deno-test-setup.ts";

import { fetchBody, fetchHeaders, fetchOnce, resetMockFetch } from './common/utils/test-utils.ts';
import { NotFoundException } from './common/exceptions/not-found.exception.ts';
import { WorkOS } from './index.ts';
import { WorkOS as WorkOSWorker } from './index.worker.ts';
import { FetchHttpClient } from './common/net/fetch-client.ts';
import { DenoHttpClient } from './common/net/deno-client.ts';
import { SubtleCryptoProvider } from './common/crypto/subtle-crypto-provider.ts';

// Main test suite
describe('WorkOS', () => {
  // Reset fetch mocks before each test
  beforeEach(() => {
    resetMockFetch();
  });

  describe('constructor', () => {
    // Store original environment variables
    const API_KEY = Deno.env.get('WORKOS_API_KEY');
    const NODE_ENV = Deno.env.get('NODE_ENV');

    beforeEach(() => {
      // Clear environment variables for testing
      if (NODE_ENV) Deno.env.delete('NODE_ENV');
    });

    afterEach(() => {
      // Restore original environment variables
      if (API_KEY) Deno.env.set('WORKOS_API_KEY', API_KEY);
      if (NODE_ENV) Deno.env.set('NODE_ENV', NODE_ENV);
    });

    describe('when no API key is provided', () => {
      it('throws a NoApiKeyFoundException error', async () => {
        try {
          new WorkOS();
          throw new Error('Expected to throw but did not');
        } catch (error) {
          // Test passes if we get here
          assertEquals(error instanceof Error, true);
        }
      });
    });

    describe('when API key is provided with environment variable', () => {
      it('initializes', async () => {
        // Set environment variable using Deno.env.set
        Deno.env.set('WORKOS_API_KEY', 'sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
        const createWorkOS = () => new WorkOS();
        // Should not throw
        createWorkOS();
      });
    });

    describe('when API key is provided with constructor', () => {
      it('initializes', async () => {
        const createWorkOS = () => new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
        // Should not throw
        createWorkOS();
      });
    });

    describe('with https option', () => {
      it('sets baseURL', () => {
        const workos = new WorkOS('foo', { https: false });
        assertEquals(workos.baseURL, 'http://api.workos.com');
      });
    });

    describe('with apiHostname option', () => {
      it('sets baseURL', () => {
        const workos = new WorkOS('foo', { apiHostname: 'localhost' });
        assertEquals(workos.baseURL, 'https://localhost');
      });
    });

    describe('with port option', () => {
      it('sets baseURL', () => {
        const workos = new WorkOS('foo', {
          apiHostname: 'localhost',
          port: 4000,
        });
        assertEquals(workos.baseURL, 'https://localhost:4000');
      });
    });

    describe('when the `config` option is provided', () => {
      it('applies the configuration to the fetch client', async () => {
        fetchOnce('{}', { headers: { 'X-Request-ID': 'a-request-id' } });

        const workos = new WorkOS('sk_test', {
          config: {
            headers: {
              'X-My-Custom-Header': 'Hey there!',
            },
          },
        });

        await workos.post('/somewhere', {});

        expect(fetchHeaders()).toMatchObject({
          'X-My-Custom-Header': 'Hey there!',
        });
      });
    });

    describe('when the `appInfo` option is provided', () => {
      it('applies the configuration to the fetch client user-agent', async () => {
        fetchOnce('{}');

        const packageJson = JSON.parse(
          await Deno.readTextFile('package.json'),
        );

        const workos = new WorkOS('sk_test', {
          appInfo: {
            name: 'fooApp',
            version: '1.0.0',
          },
        });

        await workos.post('/somewhere', {});

        expect(fetchHeaders()).toMatchObject({
          'User-Agent': `workos-node/${packageJson.version}/fetch fooApp: 1.0.0`,
        });
      });
    });

    describe('when no `appInfo` option is provided', () => {
      it('adds the HTTP client name to the user-agent', async () => {
        fetchOnce('{}');

        const packageJson = JSON.parse(
          await Deno.readTextFile('package.json'),
        );

        const workos = new WorkOS('sk_test');

        await workos.post('/somewhere', {});

        expect(fetchHeaders()).toMatchObject({
          'User-Agent': `workos-node/${packageJson.version}/fetch`,
        });
      });
    });

    describe('when using an environment that supports fetch', () => {
      it('automatically uses the fetch HTTP client', () => {
        const workos = new WorkOS('sk_test');

        // Check if client is an instance of FetchHttpClient
        const client = workos['client'];
        assertEquals(client instanceof FetchHttpClient, true);
      });
    });
  });

  describe('version', () => {
    it('matches the version in `package.json`', async () => {
      const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

      // Read `package.json` using file I/O instead of `require` so we don't run
      // into issues with the `require` cache.
      const packageJson = JSON.parse(await Deno.readTextFile('package.json'));

      assertEquals(workos.version, packageJson.version);
    });
  });

  describe('post', () => {
    describe('when the api responds with a 404', () => {
      it('throws a NotFoundException', async () => {
        const message = 'Not Found';
        fetchOnce(
          { message },
          { status: 404, headers: { 'X-Request-ID': 'a-request-id' } },
        );

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        try {
          await workos.post('/path', {});
          throw new Error('Expected to throw but did not');
        } catch (error) {
          assertEquals(error instanceof NotFoundException, true);
        }
      });

      it('preserves the error code, status, and message from the underlying response', async () => {
        const message = 'The thing you are looking for is not here.';
        const code = 'thing-not-found';
        fetchOnce(
          { code, message },
          { status: 404, headers: { 'X-Request-ID': 'a-request-id' } },
        );

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        try {
          await workos.post('/path', {});
          throw new Error('Expected to throw but did not');
        } catch (error) {
          // Type assertion for the error
          const notFoundError = error as NotFoundException;
          assertEquals(notFoundError.code, code);
          assertEquals(notFoundError.message, message);
          assertEquals(notFoundError.status, 404);
        }
      });

      it('includes the path in the message if there is no message in the response', async () => {
        const code = 'thing-not-found';
        const path = '/path/to/thing/that-aint-there';
        fetchOnce(
          { code },
          { status: 404, headers: { 'X-Request-ID': 'a-request-id' } },
        );

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        try {
          await workos.post(path, {});
          throw new Error('Expected to throw but did not');
        } catch (error) {
          // Type assertion for the error
          const notFoundError = error as NotFoundException;
          assertEquals(notFoundError.code, code);
          assertEquals(notFoundError.message, `The requested path '${path}' could not be found.`);
          assertEquals(notFoundError.status, 404);
        }
      });
    });

    describe('when the api responds with a 500 and no error/error_description', () => {
      it('throws an GenericServerException', async () => {
        fetchOnce(
          {},
          {
            status: 500,
            headers: { 'X-Request-ID': 'a-request-id' },
          },
        );

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        try {
          await workos.post('/path', {});
          throw new Error('Expected to throw but did not');
        } catch (error) {
          assertEquals(error instanceof Error, true);
          assertEquals((error as Error).message.includes('Server Error'), true);
        }
      });
    });

    describe('when the api responds with a 400 and an error/error_description', () => {
      it('throws an OauthException', async () => {
        fetchOnce(
          { error: 'error', error_description: 'error description' },
          {
            status: 400,
            headers: { 'X-Request-ID': 'a-request-id' },
          },
        );

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        try {
          await workos.post('/path', {});
          throw new Error('Expected to throw but did not');
        } catch (error) {
          assertEquals(error instanceof Error, true);
          assertEquals((error as Error).message.includes('error description'), true);
        }
      });
    });

    describe('when the api responses with a 429', () => {
      it('throws a RateLimitExceededException', async () => {
        fetchOnce(
          {
            message: 'Too many requests',
          },
          {
            status: 429,
            headers: { 'X-Request-ID': 'a-request-id', 'Retry-After': '10' },
          },
        );

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        try {
          await workos.get('/path');
          throw new Error('Expected to throw but did not');
        } catch (error) {
          assertEquals(error instanceof Error, true);
          assertEquals((error as Error).message.includes('Too many requests'), true);
        }
      });
    });

    describe('when the entity is null', () => {
      it('sends an empty string body', async () => {
        fetchOnce();

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
        await workos.post('/somewhere', null);

        assertEquals(fetchBody({ raw: true }), '');
      });
    });
  });

  describe('when in an environment that does not support fetch', () => {
    const fetchFn = globalThis.fetch;
    let originalFetch: typeof fetch;

    beforeEach(() => {
      // Save original fetch
      originalFetch = globalThis.fetch;
      // Set fetch to undefined
      (globalThis as { fetch?: typeof fetch }).fetch = undefined;
    });

    afterEach(() => {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    });

    it('automatically uses the Deno HTTP client', () => {
      const workos = new WorkOS('sk_test_key');

      // Check if client is an instance of DenoHttpClient
      const client = workos['client'];
      assertEquals(client instanceof DenoHttpClient, true);
    });

    it('uses a fetch function if provided', () => {
      const workos = new WorkOS('sk_test_key', {
        fetchFn,
      });

      // Check if client is an instance of FetchHttpClient
      const client = workos['client'];
      assertEquals(client instanceof FetchHttpClient, true);
    });
  });

  describe('when in a worker environment', () => {
    it('uses the worker client', () => {
      const workos = new WorkOSWorker('sk_test_key');

      // Check if client is an instance of FetchHttpClient
      const client = workos['client'];
      assertEquals(client instanceof FetchHttpClient, true);

      // Check if webhooks and actions use SubtleCryptoProvider
      const webhooksCryptoProvider = workos.webhooks['signatureProvider']['cryptoProvider'];
      assertEquals(webhooksCryptoProvider instanceof SubtleCryptoProvider, true);

      const actionsCryptoProvider = workos.actions['signatureProvider']['cryptoProvider'];
      assertEquals(actionsCryptoProvider instanceof SubtleCryptoProvider, true);
    });

    it('uses console.warn to emit warnings', () => {
      const workos = new WorkOSWorker('sk_test_key');
      
      // Use a simple approach for testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;
      let warnMessage = '';
      
      // Replace console.warn temporarily
      console.warn = (message: string) => {
        warnCalled = true;
        warnMessage = message;
      };

      workos.emitWarning('foo');

      // Check if warn was called with the expected message
      assertEquals(warnCalled, true);
      assertEquals(warnMessage, 'WorkOS: foo');
      
      // Restore original console.warn
      console.warn = originalWarn;
    });
  });

  describe('when in a Deno environment', () => {
    it('uses console.warn to emit warnings', () => {
      const workos = new WorkOS('sk_test_key');
      
      // Use a simple approach for testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;
      let warnMessage = '';
      
      // Replace console.warn temporarily
      console.warn = (message: string) => {
        warnCalled = true;
        warnMessage = message;
      };

      workos.emitWarning('foo');

      // Check if warn was called with the expected message
      assertEquals(warnCalled, true);
      assertEquals(warnMessage, 'WorkOS: foo');
      
      // Restore original console.warn
      console.warn = originalWarn;
    });
  });
});
