export interface GenerateLinkOptions {
  organization: string;
  intent: 'sso' | 'dsync' | 'audit_logs' | 'log_streams';
  return_url?: string;
}