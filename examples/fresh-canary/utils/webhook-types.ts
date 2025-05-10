// Shared types for the webhook components

// Type definition for webhook events
export interface WebhookEvent {
  id: string;
  event: string;
  data: unknown;
  timestamp: string;
  verified: boolean;
  rawPayload: string;
}