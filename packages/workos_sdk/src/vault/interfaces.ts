import type { List } from "../common/interfaces.ts";

export interface ObjectDigestResponse {
  id: string;
  type: string;
  created_at: string;
  updated_at: string;
  meta?: Record<string, unknown>;
}

export interface ObjectDigest {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface ReadObjectMetadataResponse {
  id: string;
  type: string;
  created_at: string;
  updated_at: string;
  meta?: Record<string, unknown>;
}

export interface ReadObjectResponse extends ReadObjectMetadataResponse {
  data?: unknown;
}

export interface VaultObject {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
  data?: unknown;
}

export interface ObjectMetadata {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface ObjectVersion {
  version: number;
  createdAt: string;
}

export interface ListObjectVersionsResponse {
  versions: {
    version: number;
    created_at: string;
  }[];
}

export interface CreateObjectOptions {
  id?: string;
  type: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

export interface ReadObjectOptions {
  id: string;
  version?: number;
}

export interface UpdateObjectOptions {
  id: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

export interface DeleteObjectOptions {
  id: string;
}

export interface KeyContext {
  [key: string]: string | number | boolean;
}

export interface DataKey {
  id: string;
  key: string;
}

export interface DataKeyPair {
  dataKey: DataKey;
  encryptedKeys: string[];
}

export interface CreateDataKeyOptions {
  context: KeyContext;
}

export interface CreateDataKeyResponse {
  data_key: {
    id: string;
    key: string;
  };
  encrypted_keys: string[];
}

export interface DecryptDataKeyOptions {
  keys: string[];
}

export interface DecryptDataKeyResponse {
  data_key: {
    id: string;
    key: string;
  };
} 