export interface ListEventsOptions {
  organization_id: string;
  range_start?: string;
  range_end?: string;
  limit?: number;
  order?: "desc" | "asc";
  actions?: string[];
  actors?: string[];
  targets?: string[];
}
