/**
 * OAuth specific exceptions for WorkOS
 */

/**
 * Base exception class for OAuth related errors
 */
export class OAuthException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthException";
  }
}

/**
 * Exception thrown when an invalid authorization code is provided
 */
export class InvalidAuthorizationCodeException extends OAuthException {
  constructor(message = "Invalid authorization code") {
    super(message);
    this.name = "InvalidAuthorizationCodeException";
  }
}

/**
 * Exception thrown when an authorization request is invalid
 */
export class InvalidAuthorizationRequestException extends OAuthException {
  constructor(message = "Invalid authorization request") {
    super(message);
    this.name = "InvalidAuthorizationRequestException";
  }
}

/**
 * Exception thrown when an access token is invalid or expired
 */
export class InvalidAccessTokenException extends OAuthException {
  constructor(message = "Invalid or expired access token") {
    super(message);
    this.name = "InvalidAccessTokenException";
  }
}

/**
 * Exception thrown when the OAuth state parameter is invalid
 */
export class InvalidStateException extends OAuthException {
  constructor(message = "Invalid state parameter") {
    super(message);
    this.name = "InvalidStateException";
  }
}

/**
 * Exception thrown when the user denies authorization
 */
export class UserDeniedAuthorizationException extends OAuthException {
  constructor(message = "User denied authorization") {
    super(message);
    this.name = "UserDeniedAuthorizationException";
  }
}

/**
 * Exception thrown when the redirect URI doesn't match the one registered
 */
export class RedirectURIMismatchException extends OAuthException {
  constructor(message = "Redirect URI mismatch") {
    super(message);
    this.name = "RedirectURIMismatchException";
  }
}
