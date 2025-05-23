import type { KeyContext } from "./key.interface.ts";
import type {
  ObjectDigest,
  ObjectMetadata,
  ObjectUpdateBy,
  ObjectVersion,
  VaultObject,
} from "./object.interface.ts";

// tslint:disable:no-empty-interface

/*
 * @deprecated Use `KeyContext` instead.
 */
export interface SecretContext extends KeyContext {}
/*
 * @deprecated Use `ObjectDigest` instead.
 */
export interface SecretDigest extends ObjectDigest {}
/*
 * @deprecated Use `ObjectUpdateBy` instead.
 */
export interface SecretUpdateBy extends ObjectUpdateBy {}
/*
 * @deprecated Use `ObjectMetadata` instead.
 */
export interface SecretMetadata extends ObjectMetadata {}
/*
 * @deprecated Use `VaultObject` instead.
 */
export interface VaultSecret extends VaultObject {}
/*
 * @deprecated Use `ObjectVersion` instead.
 */
export interface SecretVersion extends ObjectVersion {}
