import type { KeyContext } from '../key.interface.ts.ts';

export interface CreateDataKeyOptions {
  context: KeyContext;
}

export interface CreateDataKeyResponse {
  context: KeyContext;
  data_key: string;
  encrypted_keys: string;
  id: string;
}
