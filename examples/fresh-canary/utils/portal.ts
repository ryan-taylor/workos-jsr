// Portal utilities for Admin Portal functionality
import { workos } from './workos.ts';

// Portal Intent enumeration
export enum GeneratePortalLinkIntent {
  AuditLogs = 'audit_logs',
  DomainVerification = 'domain_verification',
  DSync = 'dsync',
  LogStreams = 'log_streams',
  SSO = 'sso',
  CertificateRenewal = 'certificate_renewal',
}

// Types
export interface PortalLinkOptions {
  intent: GeneratePortalLinkIntent;
  organization: string;
  returnUrl?: string;
  successUrl?: string;
}

export interface PortalBrandingOptions {
  logo?: string;
  primaryColor?: string;
  headerText?: string;
}

// Function to generate an admin portal link
export async function generatePortalLink(options: PortalLinkOptions): Promise<string> {
  try {
    const { intent, organization, returnUrl, successUrl } = options;

    const response = await workos.portal.generateLink({
      intent,
      organization,
      returnUrl,
      successUrl,
    });

    return response.link;
  } catch (error) {
    console.error('Error generating portal link:', error);
    throw error;
  }
}

// Get intent display name for readability
export function getIntentDisplayName(intent: GeneratePortalLinkIntent): string {
  const displayNames: Record<GeneratePortalLinkIntent, string> = {
    [GeneratePortalLinkIntent.AuditLogs]: 'Audit Logs',
    [GeneratePortalLinkIntent.DomainVerification]: 'Domain Verification',
    [GeneratePortalLinkIntent.DSync]: 'Directory Sync',
    [GeneratePortalLinkIntent.LogStreams]: 'Log Streams',
    [GeneratePortalLinkIntent.SSO]: 'Single Sign-On',
    [GeneratePortalLinkIntent.CertificateRenewal]: 'Certificate Renewal',
  };

  return displayNames[intent] || String(intent);
}
