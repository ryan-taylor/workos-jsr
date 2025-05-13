import type { List } from "workos/common/interfaces.ts";

/**
 * Raw API response for a Vault object digest.
 * Contains basic metadata returned by the API.
 */
export interface ObjectDigestResponse {
  id: string;
  type: string;
  created_at: string;
  updated_at: string;
  meta?: Record<string, unknown>;
}

/**
 * Represents a Vault object digest in client code.
 */
export interface ObjectDigest {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

/**
 * Raw API response for reading Vault object metadata.
 */
export interface ReadObjectMetadataResponse {
  id: string;
  type: string;
  created_at: string;
  updated_at: string;
  meta?: Record<string, unknown>;
}

/**
 * Raw API response for reading Vault object with data.
 */
export interface ReadObjectResponse extends ReadObjectMetadataResponse {
  data?: unknown;
}

/**
 * Represents a Vault object including its data and metadata.
 */
export interface VaultObject {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
  data?: unknown;
}

/**
 * Represents metadata of a Vault object (without its data).
 */
export interface ObjectMetadata {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

/**
 * Represents a single version entry for a Vault object.
 */
export interface ObjectVersion {
  version: number;
  createdAt: string;
}

/**
 * Raw API response for listing object versions.
 */
export interface ListObjectVersionsResponse {
  versions: {
    version: number;
    created_at: string;
  }[];
}

/**
 * Options for creating or writing a Vault object.
 */
export interface CreateObjectOptions {
  id?: string;
  type: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

/**
 * Options for reading a Vault object.
 */
export interface ReadObjectOptions {
  id: string;
  version?: number;
}

/**
 * Options for updating a Vault object.
 */
export interface UpdateObjectOptions {
  id: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

/**
 * Options for deleting a Vault object.
 */
export interface DeleteObjectOptions {
  id: string;
}

/**
 * Context metadata for data keys.
 * Used to scope data keys by contextual information.
 */
export interface KeyContext {
  [key: string]: string | number | boolean;
}

/**
 * Represents a decrypted data key.
 */
export interface DataKey {
  id: string;
  key: string;
}

/**
 * Represents a data key pair containing plaintext and encrypted keys.
 */
export interface DataKeyPair {
  dataKey: DataKey;
  encryptedKeys: string[];
}

/**
 * Options for creating a new data key.
 * @example
 * ```ts
 * const options: CreateDataKeyOptions = { context: { user: '123' } };
 * ```
 */
export interface CreateDataKeyOptions {
  context: KeyContext;
}

/**
 * Raw API response for creating a data key.
 */
export interface CreateDataKeyResponse {
  data_key: {
    id: string;
    key: string;
  };
  encrypted_keys: string[];
}

/**
 * Options for decrypting encrypted data keys.
 */
export interface DecryptDataKeyOptions {
  keys: string[];
}

/**
 * Raw API response for decrypting a data key.
 */
export interface DecryptDataKeyResponse {
  data_key: {
    id: string;
    key: string;
  };
} 