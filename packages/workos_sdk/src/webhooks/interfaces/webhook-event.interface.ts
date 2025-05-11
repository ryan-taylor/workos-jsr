export interface WebhookEvent {
  id: string;
  event: string;
  data: Record<string, unknown>;
  created_at: string;
}
