import type { KeyContext } from '../key.interface.ts.ts';

export interface CreateObjectEntity {
  name: string;
  value: string;
  key_context: KeyContext;
}

export interface CreateObjectOptions {
  name: string;
  value: string;
  context: KeyContext;
}
