export interface Event {
  id: string;
  event: string;
  data: Record<string, unknown>;
  created_at: string;
}