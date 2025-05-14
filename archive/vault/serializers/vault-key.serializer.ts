/**
 * ARCHIVED MODULE
 * --------------
 * This file is part of the deprecated Vault module that has been archived.
 * It was moved from src/vault/serializers/vault-key.serializer.ts to archive/vault/serializers/
 * as part of a code cleanup effort.
 *
 * @ts-nocheck - This file is archived and should be excluded from type checking
 */

import type { CreateDataKeyResponse } from "../interfaces/key/create-data-key.interface.ts";
import type { DecryptDataKeyResponse } from "../interfaces/key/decrypt-data-key.interface.ts";
import type { DataKey, DataKeyPair } from "../interfaces/key.interface.ts";

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
