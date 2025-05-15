/**
 * Interfaces for the User Management module
 */

import { PaginationParams } from "../common/utils/pagination.ts";

/**
 * Interface for a User object
 */
export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  first_name: string | null;
  last_name: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  profile_picture_url: string | null;
  status: "active" | "inactive" | "suspended";
}

/**
 * Interface for User creation options
 */
export interface CreateUserOptions {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email_verified?: boolean;
  profile_picture_url?: string;
  organization_id?: string;
}

/**
 * Interface for User update options
 */
export interface UpdateUserOptions {
  first_name?: string;
  last_name?: string;
  email_verified?: boolean;
  password?: string;
  profile_picture_url?: string;
  organization_id?: string;
  status?: "active" | "inactive" | "suspended";
}

/**
 * Interface for authenticating a user
 */
export interface AuthenticateOptions {
  email: string;
  password: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Interface for authentication response
 */
export interface AuthenticationResponse {
  user: User;
  authentication_token: string;
  refresh_token: string;
  access_token: string;
  expiration_time: number;
}

/**
 * Interface for password reset options
 */
export interface SendPasswordResetEmailOptions {
  email: string;
  password_reset_url: string;
}

/**
 * Interface for password reset with token options
 */
export interface ResetPasswordOptions {
  token: string;
  new_password: string;
}

/**
 * Interface for listing users
 */
export interface ListUsersOptions extends PaginationParams {
  email?: string;
  organization_id?: string;
  status?: "active" | "inactive" | "suspended";
}

/**
 * Interface for User invitation options
 */
export interface InviteUserOptions {
  email: string;
  first_name?: string;
  last_name?: string;
  organization_id?: string;
  invitation_url: string;
}

/**
 * Interface for verifying a session token
 */
export interface VerifySessionOptions {
  token: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Interface for refreshing a session
 */
export interface RefreshSessionOptions {
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Interface for OAuth tokens
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scopes?: string[];
}

/**
 * Interface for OAuth tokens response from API
 */
export interface OAuthTokensResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes?: string[];
}

/**
 * Interface for serialized update user password options
 */
export interface SerializedUpdateUserPasswordOptions {
  password: string;
}

/**
 * Interface for update user password options
 */
export interface UpdateUserPasswordOptions {
  password: string;
}
