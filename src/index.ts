import { DenoCryptoProvider } from './common/crypto/deno-crypto-provider.ts';
import { SubtleCryptoProvider } from './common/crypto/subtle-crypto-provider.ts';
import type { CryptoProvider } from './common/crypto/crypto-provider.ts';
import { WebCryptoProvider } from './common/crypto/web-crypto-provider.ts';

import type { HttpClient } from './common/net/http-client.ts';
import { FetchHttpClient } from './common/net/fetch-client.ts';
import { DenoHttpClient } from './common/net/deno-client.ts';

import { Actions } from './actions/actions.ts';
import { Webhooks } from './webhooks/webhooks.ts';
import { WorkOS } from './workos.ts';
import type { WorkOSOptions } from './common/interfaces/index.ts';
import { FreshSessionProvider } from './common/iron-session/fresh-session-provider.ts';
// Removed Node-specific process import for Deno compatibility

export * from './actions/interfaces/index.ts';
export * from './audit-logs/interfaces/index.ts';
export * from './common/exceptions/index.ts';
export * from './common/interfaces/index.ts';
export * from './common/utils/pagination.ts';
export * from './directory-sync/interfaces/index.ts';
export * from './directory-sync/utils/get-primary-email.ts';
export * from './events/interfaces/index.ts';
export * from './fga/interfaces/index.ts';
export * from './organizations/interfaces/index.ts';
export * from './organization-domains/interfaces/index.ts';
export * from './passwordless/interfaces/index.ts';
export * from './portal/interfaces/index.ts';
export * from './sso/interfaces/index.ts';
export * from './user-management/interfaces/index.ts';
export * from './roles/interfaces/index.ts';

class WorkOSNode extends WorkOS {
  override createHttpClient(options: WorkOSOptions, userAgent: string): HttpClient {
    const opts = {
      ...options.config,
      headers: {
        ...options.config?.headers,
        Authorization: `Bearer ${this.key}`,
        'User-Agent': userAgent,
      },
    };

    // Use FetchHttpClient if fetch is available
    if (typeof fetch !== 'undefined' || typeof options.fetchFn !== 'undefined') {
      return new FetchHttpClient(this.baseURL, opts, options.fetchFn);
    }
    // Fallback to DenoHttpClient
    return new DenoHttpClient(this.baseURL, opts);
  }

  override createWebhookClient(): Webhooks {
    let cryptoProvider: CryptoProvider;

    if (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined') {
      // Default to WebCryptoProvider when Web Crypto API is available
      cryptoProvider = new WebCryptoProvider();
    } else if (typeof Deno !== 'undefined') {
      cryptoProvider = new DenoCryptoProvider();
    } else {
      // Fallback for other environments
      cryptoProvider = new SubtleCryptoProvider();
    }

    return new Webhooks(cryptoProvider);
  }

  override createActionsClient(): Actions {
    let cryptoProvider: CryptoProvider;

    if (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined') {
      // Default to WebCryptoProvider when Web Crypto API is available
      cryptoProvider = new WebCryptoProvider();
    } else if (typeof Deno !== 'undefined') {
      cryptoProvider = new DenoCryptoProvider();
    } else {
      // Fallback for other environments
      cryptoProvider = new SubtleCryptoProvider();
    }

    return new Actions(cryptoProvider);
  }

  override createIronSessionProvider(): FreshSessionProvider {
    return new FreshSessionProvider();
  }

  override emitWarning(warning: string): void {
    // Use console.warn instead of process.emitWarning for Deno compatibility
    console.warn(`WorkOS: ${warning}`);
  }
}

export { WorkOSNode as WorkOS };
