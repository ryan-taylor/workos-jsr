import type {
  CreateObjectOptions,
  ObjectDigest,
  ObjectDigestResponse,
  ObjectMetadata,
  ObjectVersion,
  ReadObjectMetadataResponse,
  ReadObjectResponse,
  UpdateObjectOptions,
  VaultObject,
} from "../interfaces.ts";
import type { List, ListResponse } from "../../common/interfaces.ts";

export const serializeCreateObjectEntity = (
  options: CreateObjectOptions,
): Record<string, unknown> => {
  return {
    id: options.id,
    type: options.type,
    data: options.data,
    meta: options.meta,
  };
};

export const serializeUpdateObjectEntity = (
  options: UpdateObjectOptions,
): Record<string, unknown> => {
  return {
    data: options.data,
    meta: options.meta,
  };
};

export const deserializeObjectMetadata = (
  data: ReadObjectMetadataResponse,
): ObjectMetadata => {
  return {
    id: data.id,
    type: data.type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    meta: data.meta,
  };
};

export const deserializeObject = (data: ReadObjectResponse): VaultObject => {
  return {
    id: data.id,
    type: data.type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    meta: data.meta,
    data: data.data,
  };
};

export const deserializeListObjects = (
  data: ListResponse<ObjectDigestResponse>,
): List<ObjectDigest> => {
  return {
    object: "list",
    data: data.data.map((object: ObjectDigestResponse) => ({
      id: object.id,
      type: object.type,
      createdAt: object.created_at,
      updatedAt: object.updated_at,
      meta: object.meta,
    })),
    listMetadata: data.listMetadata,
  };
};

export const desrializeListObjectVersions = (
  data: { versions: { version: number; created_at: string }[] },
): ObjectVersion[] => {
  return data.versions.map((version) => ({
    version: version.version,
    createdAt: version.created_at,
  }));
};
