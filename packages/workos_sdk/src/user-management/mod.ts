/**
 * @module user-management
 * @description Exports for User Management module
 * @public
 */

// Re-export the UserManagement class
export { UserManagement } from "./user-management.ts";

// Re-export main interfaces
export * from "./interfaces.ts";

// Re-export interfaces directory
export * from "./interfaces/index.ts";
export * from "./interfaces/authenticate-options.interface.ts";
export * from "./interfaces/create-user-options.interface.ts";
export * from "./interfaces/session.interface.ts";
export * from "./interfaces/session-auth.interface.ts";
export * from "./interfaces/user.interface.ts";
