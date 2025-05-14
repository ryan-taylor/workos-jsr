import { SubtleCryptoProvider } from "../common/crypto/subtle-crypto-provider.ts";

/**
 * Service for generating and verifying WorkOS CSRF tokens and actions.
 *
 * The Actions API is used to create secure, one-time-use tokens for user actions,
 * providing protection against CSRF and replay attacks.
 *
 * @example
 * ```ts
 * // Create a new Actions client
 * const actions = workos.actions;
 * // Implementation-specific methods will be available here
 * ```
 */
export class Actions {
  /**
   * Creates a new Actions client with the given crypto provider.
   * @param cryptoProvider - Provider for cryptographic operations like signing tokens
   */
  constructor(private readonly cryptoProvider: SubtleCryptoProvider) {}
}
