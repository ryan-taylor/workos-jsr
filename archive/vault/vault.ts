/**
 * ARCHIVED MODULE
 * --------------
 * This Vault module has been archived as it is no longer actively maintained.
 * The functionality has been superseded by newer secure storage solutions.
 * Please use the new Object Storage API for similar functionality.
 *
 * This file was moved from src/vault/vault.ts to archive/vault/vault.ts
 * as part of a code cleanup effort.
 *
 * @ts-nocheck - This file is archived and should be excluded from type checking
 */

import type {
  List,
  ListResponse,
  PaginationOptions,
} from "../../src/common/interfaces.ts";
import type { WorkOS } from "../../src/workos.ts";
import { decode, decrypt } from "./cryptography/decrypt.ts";
import { encrypt } from "./cryptography/encrypt.ts";
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

export class Vault {
  constructor(private readonly workos: WorkOS) {}

  async createObject(options: CreateObjectOptions): Promise<ObjectMetadata> {
    const { data } = await this.workos.post<ReadObjectMetadataResponse>(
      `/vault/v1/kv`,
      serializeCreateObjectEntity(options),
    );
    return deserializeObjectMetadata(data);
  }

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

  async listObjectVersions(
    options: ReadObjectOptions,
  ): Promise<ObjectVersion[]> {
    const { data } = await this.workos.get<ListObjectVersionsResponse>(
      `/vault/v1/kv/${encodeURIComponent(options.id)}/versions`,
    );
    return desrializeListObjectVersions(data);
  }

  async readObject(options: ReadObjectOptions): Promise<VaultObject> {
    const { data } = await this.workos.get<ReadObjectResponse>(
      `/vault/v1/kv/${encodeURIComponent(options.id)}`,
    );
    return deserializeObject(data);
  }

  async describeObject(options: ReadObjectOptions): Promise<VaultObject> {
    const { data } = await this.workos.get<ReadObjectResponse>(
      `/vault/v1/kv/${encodeURIComponent(options.id)}/metadata`,
    );
    return deserializeObject(data);
  }

  async updateObject(options: UpdateObjectOptions): Promise<VaultObject> {
    const { data } = await this.workos.put<ReadObjectResponse>(
      `/vault/v1/kv/${encodeURIComponent(options.id)}`,
      serializeUpdateObjectEntity(options),
    );
    return deserializeObject(data);
  }

  async deleteObject(options: DeleteObjectOptions): Promise<void> {
    return this.workos.delete(`/vault/v1/kv/${encodeURIComponent(options.id)}`);
  }

  async createDataKey(options: CreateDataKeyOptions): Promise<DataKeyPair> {
    const { data } = await this.workos.post<CreateDataKeyResponse>(
      `/vault/v1/keys/data-key`,
      options,
    );
    return deserializeCreateDataKeyResponse(data);
  }

  async decryptDataKey(options: DecryptDataKeyOptions): Promise<DataKey> {
    const { data } = await this.workos.post<DecryptDataKeyResponse>(
      `/vault/v1/keys/decrypt`,
      options,
    );
    return deserializeDecryptDataKeyResponse(data);
  }

  async encrypt(
    data: string,
    context: KeyContext,
    associatedData?: string,
  ): Promise<string> {
    const { dataKey, encryptedKeys } = await this.createDataKey({
      context,
    });
    return encrypt(data, dataKey.key, encryptedKeys, associatedData || "");
  }

  async decrypt(
    encryptedData: string,
    associatedData?: string,
  ): Promise<string> {
    const decoded = decode(encryptedData);
    const dataKey = await this.decryptDataKey({ keys: decoded.keys });
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
