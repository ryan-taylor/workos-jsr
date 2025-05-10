import { CreateDataKeyResponse } from '../interfaces/key/create-data-key.interface.ts';
import { DecryptDataKeyResponse } from '../interfaces/key/decrypt-data-key.interface.ts';
import { DataKey, DataKeyPair } from '../interfaces/key.interface.ts';

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
