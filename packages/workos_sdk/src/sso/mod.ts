/**
 * @module sso
 * @description Exports for Single Sign-On (SSO) module
 * @public
 */

// Re-export the SSO class
export { SSO } from "./sso.ts";

// Re-export main interfaces
export * from "./interfaces.ts";

// Re-export interface directory exports
export * from "./interfaces/index.ts";
export * from "./interfaces/connection.interface.ts";
export * from "./interfaces/get-authorization-url-options.interface.ts";
export * from "./interfaces/profile.interface.ts";

// Re-export serializer directory exports
export * from "./serializers/index.ts";
export * from "./serializers/connection.serializer.ts";
export * from "./serializers/get-authorization-url-options.serializer.ts";
export * from "./serializers/profile.serializer.ts";
