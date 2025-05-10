import { AppInfo } from './app-info.interface.ts';

export interface WorkOSOptions {
  apiHostname?: string;
  https?: boolean;
  port?: number;
  config?: RequestInit;
  appInfo?: AppInfo;
  fetchFn?: typeof fetch;
  clientId?: string;
}
