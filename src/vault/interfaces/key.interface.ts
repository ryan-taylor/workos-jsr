export interface KeyContext {
  [key: string]: unknown;
}

export interface DataKeyPair {
  context: KeyContext;
  dataKey: DataKey;
  encryptedKeys: string;
}

export interface DataKey {
  key: string;
  id: string;
}
