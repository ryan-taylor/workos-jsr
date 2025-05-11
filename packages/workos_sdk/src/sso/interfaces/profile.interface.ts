export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  connection_id: string;
  organization_id: string;
  raw_attributes: Record<string, unknown>;
}