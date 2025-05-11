export interface Factor {
  id: string;
  type: "totp" | "sms";
  created_at: string;
  updated_at: string;
}
