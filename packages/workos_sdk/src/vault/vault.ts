import type {
  List,
  ListResponse,
  PaginationOptions,
} from "../common/interfaces.ts";
import type { WorkOS } from "../workos.ts";
import { decode, decrypt } from "./decrypt.ts";
import { encrypt } from "./encrypt.ts";
import type {
  CreateDataKeyOptions,
  CreateDataKeyResponse,
  CreateObjectOptions,
  DataKey,
  DataKeyPair,
  DecryptDataKeyOptions,
  DecryptDataKeyResponse,
  DeleteObjectOptions,
  KeyContext,
  ListObjectVersionsResponse,
  ObjectDigest,
  ObjectDigestResponse,
  ObjectMetadata,
  ObjectVersion,
  ReadObjectMetadataResponse,
  ReadObjectOptions,
  ReadObjectResponse,
  UpdateObjectOptions,
  VaultObject,
} from "./interfaces.ts";
import {
  deserializeCreateDataKeyResponse,
  deserializeDecryptDataKeyResponse,
} from "./serializers/vault-key.serializer.ts";
import {
  deserializeListObjects,
  deserializeObject,
  deserializeObjectMetadata,
  desrializeListObjectVersions,
  serializeCreateObjectEntity,
  serializeUpdateObjectEntity,
} from "./serializers/vault-object.serializer.ts";

/**
 * Service for Vault key-value storage and cryptographic operations in WorkOS.
 *
 * The Vault API provides secure storage for sensitive data, data key management,
 * encryption, and decryption services.
 *
 * @example
 * ```ts
 * // Create a new object
 * const metadata = await workos.vault.createObject({ id: 'secret1', value: 's3cr3t' });
 * // Encrypt data directly
 * const encrypted = await workos.vault.encrypt('hello world', { namespace: 'default' });
 * // Decrypt data
 * const decrypted = await workos.vault.decrypt(encrypted);
 * ```
 */
export class Vault {
  constructor(private readonly workos: WorkOS) {}

  /**
   * Creates or updates a key-value object in the Vault.
   *
   * @param options - Options containing object ID and value to store
   * @returns Promise resolving to metadata about the stored object
   */
  async createObject(options: CreateObjectOptions): Promise<ObjectMetadata> {
    const { data } = await this.workos.post<ReadObjectMetadataResponse>(
      `/vault/v1/kv`,
      serializeCreateObjectEntity(options),
    );
    return deserializeObjectMetadata(data);
  }

  /**
   * Lists object keys in the Vault with optional pagination.
   *
   * @param options - Pagination options (after cursor and limit)
   * @returns Promise resolving to a list of object digests
   */
  async listObjects(
    options?: PaginationOptions | undefined,
  ): Promise<List<ObjectDigest>> {
    const url = new URL("/vault/v1/kv", this.workos.baseURL);
    if (options?.after) {
      url.searchParams.set("after", options.after);
    }
    if (options?.limit) {
      url.searchParams.set("limit", options.limit.toString());
    }

    const { data } = await this.workos.get<ListResponse<ObjectDigestResponse>>(
      url.toString(),
    );
    return deserializeListObjects(data);
  }

  /**
   * Retrieves version history for a specific object.
   *
   * @param options - Options containing object ID to list versions for
   * @returns Promise resolving to an array of object versions
   */
  async listObjectVersions(
    options: ReadObjectOptions,
  ): Promise<ObjectVersion[]> {
    const { data } = await this.workos.get<ListObjectVersionsResponse>(
      `/vault/v1/kv/${encodeURIComponent(options.id)}/versions`,
    );
    return desrializeListObjectVersions(data);
  }

  /**
   * Reads the latest value of an object from the Vault.
   *
   * @param options - Options containing object ID to read
   * @returns Promise resolving to the decrypted VaultObject
   */
  async readObject(options: ReadObjectOptions): Promise<VaultObject> {
    const { data } = await this.workos.get<ReadObjectResponse>(
      `/vault/v1/kv/${encodeURIComponent(options.id)}`,
    );
    return deserializeObject(data);
  }

  /**
   * Retrieves metadata for an object without its value.
   *
   * @param options - Options containing object ID to describe
   * @returns Promise resolving to the VaultObject metadata
   */
  async describeObject(options: ReadObjectOptions): Promise<VaultObject> {
    const { data } = await this.workos.get<ReadObjectResponse>(
      `/vault/v1/kv/${encodeURIComponent(options.id)}/metadata`,
    );
    return deserializeObject(data);
  }

  /**
   * Updates the value of an existing object in the Vault.
   *
   * @param options - Options containing object ID and new value
   * @returns Promise resolving to the updated VaultObject
   */
  async updateObject(options: UpdateObjectOptions): Promise<VaultObject> {
    const { data } = await this.workos.put<ReadObjectResponse>(
      `/vault/v1/kv/${encodeURIComponent(options.id)}`,
      serializeUpdateObjectEntity(options),
    );
    return deserializeObject(data);
  }

  /**
   * Deletes an object from the Vault.
   *
   * @param options - Options containing object ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteObject(options: DeleteObjectOptions): Promise<void> {
    return this.workos.delete(`/vault/v1/kv/${encodeURIComponent(options.id)}`);
  }

  /**
   * Creates a new data key for client-side encryption.
   *
   * @param options - Options for creating a data key, including context
   * @returns Promise resolving to a DataKeyPair (plaintext and encrypted keys)
   */
  async createDataKey(options: CreateDataKeyOptions): Promise<DataKeyPair> {
    const { data } = await this.workos.post<CreateDataKeyResponse>(
      `/vault/v1/keys/data-key`,
      options,
    );
    return deserializeCreateDataKeyResponse(data);
  }

  /**
   * Decrypts an encrypted data key to retrieve the plaintext key.
   *
   * @param options - Options containing encrypted keys to decrypt
   * @returns Promise resolving to a DataKey containing the plaintext key
   */
  async decryptDataKey(options: DecryptDataKeyOptions): Promise<DataKey> {
    const { data } = await this.workos.post<DecryptDataKeyResponse>(
      `/vault/v1/keys/decrypt`,
      options,
    );
    return deserializeDecryptDataKeyResponse(data);
  }

  /**
   * Convenience method to encrypt arbitrary data using a newly generated data key.
   *
   * @param data - The plaintext data to encrypt
   * @param context - Key context metadata for the data key
   * @param associatedData - Optional associated data for AEAD encryption
   * @returns Promise resolving to the encrypted string payload
   */
  async encrypt(
    data: string,
    context: KeyContext,
    associatedData?: string,
  ): Promise<string> {
    const { dataKey, encryptedKeys } = await this.createDataKey({
      context,
    });
    return encrypt(data, dataKey.key, encryptedKeys[0], associatedData || "");
  }

  /**
   * Convenience method to decrypt data previously encrypted by `encrypt`.
   *
   * @param encryptedData - The encrypted payload to decrypt
   * @param associatedData - Optional associated data used during encryption
   * @returns Promise resolving to the decrypted plaintext string
   */
  async decrypt(
    encryptedData: string,
    associatedData?: string,
  ): Promise<string> {
    const decoded = decode(encryptedData);
    const keysArray = Array.isArray(decoded.keys)
      ? decoded.keys
      : [decoded.keys];
    const dataKey = await this.decryptDataKey({ keys: keysArray });
    return decrypt(decoded, dataKey.key, associatedData || "");
  }

  /*
   * @deprecated Use `createObject` instead.
   */
  createSecret = this.createObject;
  /*
   * @deprecated Use `listObjects` instead.
   */
  listSecrets = this.listObjects;
  /*
   * @deprecated Use `listObjectVersions` instead.
   */
  listSecretVersions = this.listObjectVersions;
  /*
   * @deprecated Use `readObject` instead.
   */
  readSecret = this.readObject;
  /*
   * @deprecated Use `describeObject` instead.
   */
  describeSecret = this.describeObject;
  /*
   * @deprecated Use `updateObject` instead.
   */
  updateSecret = this.updateObject;
  /*
   * @deprecated Use `deleteObject` instead.
   */
  deleteSecret = this.deleteObject;
}
