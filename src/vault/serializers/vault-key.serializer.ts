import type { CreateDataKeyResponse } from '../interfaces/key/create-data-key.interface.ts.ts';
import type { DecryptDataKeyResponse } from '../interfaces/key/decrypt-data-key.interface.ts.ts';
import type { DataKey, DataKeyPair } from '../interfaces/key.interface.ts.ts';

export const deserializeCreateDataKeyResponse = (
  key: CreateDataKeyResponse,
): DataKeyPair => ({
  context: key.context,
  dataKey: {
    key: key.data_key,
    id: key.id,
  },
  encryptedKeys: key.encrypted_keys,
});

export const deserializeDecryptDataKeyResponse = (
  key: DecryptDataKeyResponse,
): DataKey => ({
  key: key.data_key,
  id: key.id,
});
