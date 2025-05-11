import { SubtleCryptoProvider } from '../common/crypto/subtle-crypto-provider.ts';

export class Actions {
  constructor(private readonly cryptoProvider: SubtleCryptoProvider) {}
}