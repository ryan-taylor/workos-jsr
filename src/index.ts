import { DenoCryptoProvider } from './common/crypto/deno-crypto-provider.ts';
import { SubtleCryptoProvider } from './common/crypto/subtle-crypto-provider.ts';
import { CryptoProvider } from './common/crypto/crypto-provider.ts';
import { WebCryptoProvider } from './common/crypto/web-crypto-provider.ts';

import { HttpClient } from './common/net/http-client.ts';
import { FetchHttpClient } from './common/net/fetch-client.ts';
import { NodeHttpClient } from './common/net/node-client.ts';
import { DenoHttpClient } from './common/net/deno-client.ts';

import { Actions } from './actions/actions.ts';
import { Webhooks } from './webhooks/webhooks.ts';
import { WorkOS } from './workos.ts';
import { WorkOSOptions } from './common/interfaces.ts';
import { WebIronSessionProvider } from './common/iron-session/web-iron-session-provider.ts';
import { IronSessionProvider } from './common/iron-session/iron-session-provider.ts';

export * from './actions/interfaces.ts';
export * from './audit-logs/interfaces.ts';
export * from './common/exceptions.ts';
export * from './common/interfaces.ts';
export * from './common/utils/pagination.ts';
export * from './directory-sync/interfaces.ts';
export * from './directory-sync/utils/get-primary-email.ts';
export * from './events/interfaces.ts';
export * from './fga/interfaces.ts';
export * from './organizations/interfaces.ts';
export * from './organization-domains/interfaces.ts';
export * from './passwordless/interfaces.ts';
export * from './portal/interfaces.ts';
export * from './sso/interfaces.ts';
export * from './user-management/interfaces.ts';
export * from './roles/interfaces.ts';

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

    // Check if we're in a Deno environment
    if (typeof Deno !== 'undefined') {
      return new DenoHttpClient(this.baseURL, opts);
    }
    // Check if fetch is available (browser or environment with fetch)
    else if (
      typeof fetch !== 'undefined' ||
      typeof options.fetchFn !== 'undefined'
    ) {
      return new FetchHttpClient(this.baseURL, opts, options.fetchFn);
    }
    // Fallback to Node HTTP client
    else {
      return new NodeHttpClient(this.baseURL, opts);
    }
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

  override createIronSessionProvider(): IronSessionProvider {
    return new WebIronSessionProvider();
  }

  override emitWarning(warning: string): void {
    return process.emitWarning(warning, 'WorkOS');
  }
}

export { WorkOSNode as WorkOS };
