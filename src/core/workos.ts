import { HttpClient } from './http_client.ts.ts';
import { SSO } from '../services/sso.ts.ts';
import { Passwordless } from '../services/passwordless.ts.ts';
import { MFA } from '../services/mfa.ts.ts';
import { Organizations } from '../services/organizations.ts.ts';
import { DirectorySync } from '../services/directory_sync.ts.ts';

export interface WorkOSOptions {
  apiKey: string;
  baseUrl?: string;
}

export class WorkOS {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly httpClient: HttpClient;
  readonly sso: SSO;
  readonly passwordless: Passwordless;
  readonly mfa: MFA;
  readonly organizations: Organizations;
  readonly directorySync: DirectorySync;

  constructor(options: WorkOSOptions) {
    if (!options?.apiKey) {
      throw new Error('WorkOS: apiKey is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.workos.com';
    this.httpClient = new HttpClient();
    this.sso = new SSO({
      httpClient: this.httpClient,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
    });
    this.passwordless = new Passwordless({
      httpClient: this.httpClient,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
    });
    this.mfa = new MFA({
      httpClient: this.httpClient,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
    });
    this.organizations = new Organizations({
      httpClient: this.httpClient,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
    });
    this.directorySync = new DirectorySync({
      httpClient: this.httpClient,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
    });
  }
} 