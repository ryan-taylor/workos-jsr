import { Actions } from './actions/actions.ts';
import { SubtleCryptoProvider } from './common/crypto/subtle-crypto-provider.ts';
import { FreshSessionProvider } from './common/iron-session/fresh-session-provider.ts';
import { FetchHttpClient } from './common/net/fetch-client.ts';
import type { HttpClient } from './common/net/http-client.ts';
import type { WorkOSOptions } from './common/interfaces/index.ts';
import { Webhooks } from './webhooks/webhooks.ts';
import { WorkOS } from './workos.ts';

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

class WorkOSWorker extends WorkOS {
  /** @override */
  override createHttpClient(options: WorkOSOptions, userAgent: string): HttpClient {
    return new FetchHttpClient(this.baseURL, {
      ...options.config,
      headers: {
        ...options.config?.headers,
        Authorization: `Bearer ${this.key}`,
        'User-Agent': userAgent,
      },
    });
  }

  /** @override */
  override createWebhookClient(): Webhooks {
    const cryptoProvider = new SubtleCryptoProvider();

    return new Webhooks(cryptoProvider);
  }

  /** @override */
  override createActionsClient(): Actions {
    const cryptoProvider = new SubtleCryptoProvider();

    return new Actions(cryptoProvider);
  }

  /** @override */
  override createIronSessionProvider(): FreshSessionProvider {
    return new FreshSessionProvider();
  }

  /** @override */
  override emitWarning(warning: string): void {
    // tslint:disable-next-line:no-console
    return console.warn(`WorkOS: ${warning}`);
  }
}

export { WorkOSWorker as WorkOS };
