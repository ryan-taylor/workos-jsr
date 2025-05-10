import { Actions } from './actions/actions.ts';
import { SubtleCryptoProvider } from './common/crypto/subtle-crypto-provider.ts';
import { EdgeIronSessionProvider } from './common/iron-session/edge-iron-session-provider.ts';
import { IronSessionProvider } from './common/iron-session/iron-session-provider.ts';
import { FetchHttpClient } from './common/net/fetch-client.ts';
import { HttpClient } from './common/net/http-client.ts';
import { WorkOSOptions } from './index.worker.ts';
import { Webhooks } from './webhooks/webhooks.ts';
import { WorkOS } from './workos.ts';

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

class WorkOSWorker extends WorkOS {
  /** @override */
  createHttpClient(options: WorkOSOptions, userAgent: string): HttpClient {
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
  createWebhookClient(): Webhooks {
    const cryptoProvider = new SubtleCryptoProvider();

    return new Webhooks(cryptoProvider);
  }

  /** @override */
  createActionsClient(): Actions {
    const cryptoProvider = new SubtleCryptoProvider();

    return new Actions(cryptoProvider);
  }

  /** @override */
  createIronSessionProvider(): IronSessionProvider {
    return new EdgeIronSessionProvider();
  }

  /** @override */
  emitWarning(warning: string): void {
    // tslint:disable-next-line:no-console
    return console.warn(`WorkOS: ${warning}`);
  }
}

export { WorkOSWorker as WorkOS };
