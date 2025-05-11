export interface PasswordlessSession {
  id: string;
  email: string;
  expires_at: string;
  link: string;
}