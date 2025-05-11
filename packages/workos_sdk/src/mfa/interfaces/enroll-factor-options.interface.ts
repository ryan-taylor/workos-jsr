export interface EnrollFactorOptions {
  type: "totp" | "sms";
  phone_number?: string;
  totp_issuer?: string;
  totp_user?: string;
}
