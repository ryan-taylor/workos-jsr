# TypeScript Import Path Errors Burndown List

## 1. Import Map Issues

- [ ] Inconsistency between `import_map.f1.json` and `import_map.f2.json` - need standardized mappings
- [ ] Warning in deno.json: "the configuration file contains an entry for 'importMap' that is being ignored"

## 2. Fresh 2.x Compatibility Errors

### Server Module Type Errors in workos_fresh

- [ ] **Router.ts Line 69**: TypeScript error TS2352
  ```
  Conversion of type 'typeof import("https://jsr.io/@fresh/core/2.0.0-alpha.29/src/mod.ts")' to type 'ServerModule' may be a mistake because neither type sufficiently overlaps with the other.
  The types returned by 'new App(...)' are incompatible between these types.
  Property 'build' is missing in type 'App<any>' but required in type 'App'.
  ```

- [ ] **Server.ts Line 32**: TypeScript error TS2352
  ```
  Conversion of type 'typeof import("https://jsr.io/@fresh/core/2.0.0-alpha.29/src/mod.ts")' to type 'ServerModule' may be a mistake because neither type sufficiently overlaps with the other.
  The types returned by 'new App(...)' are incompatible between these types.
  Property 'build' is missing in type 'App<any>' but required in type 'App'.
  ```

## 3. Path Resolution Errors in fresh-canary Example

- [ ] **fresh-canary/main.ts**: Cannot find modules
  - [ ] Cannot find module 'file:///Users/t/Developer/workos-node/packages/workos_fresh/middleware.ts'
  - [ ] Cannot find module 'file:///Users/t/Developer/workos-node/packages/workos_fresh/router.ts'
  - [ ] Cannot find module 'file:///Users/t/Developer/workos-node/packages/workos_fresh/plugins/tailwind.ts'

## 4. Context/Property Access Errors

- [ ] **fresh-canary/routes/login.tsx Line 4**: Property 'workos' does not exist on type 'FreshContext'
  ```
  Property 'workos' does not exist on type 'FreshContext<Record<string, unknown>, unknown, Record<string, string>>'.
  ```

- [ ] **fresh-canary/utils/auth-context.tsx**: Missing React context

- [ ] **fresh-canary/workos_internal/middleware/security.ts Line 132**: Property 'join' does not exist on type 'string | string[]'
  ```
  Property 'join' does not exist on type 'string | string[]'.
  Property 'join' does not exist on type 'string'.
  ```

## 5. JSX Related Errors 

- [ ] **Multiple JSX files**: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists
- [ ] **Multiple JSX files**: This JSX tag requires 'React' to be in scope, but it could not be found

## Action Items

1. Standardize import maps:
   - [ ] Update `import_map.f1.json` to include missing mappings for @workos/sdk and @workos/fresh
   - [ ] Add consistent patterns for mapping both imported and exported modules

2. Fix Fresh 2.x compatibility:
   - [ ] Update types in `packages/workos_fresh/src/types.ts` to match the actual Fresh 2.x API
   - [ ] Properly handle the missing 'build' property in Fresh 2.x App type

3. Update path resolutions:
   - [ ] Ensure packages/workos_fresh modules are properly exported and importable
   - [ ] Use mapped imports instead of direct file paths

4. Fix JSX-related issues:
   - [ ] Add proper JSX import/setup in Fresh Canary example files
   - [ ] Import React/Preact properly in all JSX files