export interface EmbedOptions {
  organization_id: string;
  intent: 'sso' | 'dsync' | 'audit_logs';
  return_url?: string;
  state?: string;
}