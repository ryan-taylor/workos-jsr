import type { CreateDataKeyResponse, DataKey, DataKeyPair, DecryptDataKeyResponse } from "../interfaces.ts";

export const deserializeCreateDataKeyResponse = (
  data: CreateDataKeyResponse,
): DataKeyPair => {
  return {
    dataKey: {
      id: data.data_key.id,
      key: data.data_key.key,
    },
    encryptedKeys: data.encrypted_keys,
  };
};

export const deserializeDecryptDataKeyResponse = (
  data: DecryptDataKeyResponse,
): DataKey => {
  return {
    id: data.data_key.id,
    key: data.data_key.key,
  };
}; 