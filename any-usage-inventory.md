# Any Type Usage Inventory in Test and Example Files

This inventory documents the remaining `any` types in test files and examples as
part of Phase 1 of our type safety refactoring project.

## Examples Directory

### examples/fresh-canary

#### 1. Routes

- **routes/api/actions/list.ts**
  ```typescript
  function filterActions(actions: any[], filters: Record<string, string>) {
  ```
  - Mock objects: Actions array typed as `any[]`

#### 2. Hooks

- **hooks/use-workos.ts**
  ```typescript
  data: any[];
  listMetadata?: { before: string | null; after: string | null };
  ```
  - Response objects: Data array in list responses typed as `any[]`

#### 3. Tests

- **tests/session_test.ts**
  ```typescript
  override async getSession<T>(req: Request, options: any): Promise<T | null> {
  ```
  ```typescript
  options: any,
  ```
  - Test context objects: Session options typed as `any`

- **tests/hydration_test.ts**
  ```typescript
  function simulateHydration(Component: any, props: any) {
  ```
  - Test helper utilities: Component and props parameters typed as `any`

#### 4. Middleware

- **middleware.ts**
  ```typescript
  setSession: async (profile: any) => {
  ```
  ```typescript
  updateSession: async (data: any) => {
  ```
  - Mock objects: Profile and session data typed as `any`

## Tests_deno Directory

### Core Tests

#### 1. workos_core.test.ts

```typescript
await (workos as any).get("/organizations");
```

```typescript
async () => await (workos as any).get("/organizations"),
```

- Type assertions: WorkOS instance cast as `any` for testing

#### 2. security-error-handling.test.ts

```typescript
} as any,
```

- Mock objects: Several mock credentials objects cast as `any` for testing
  security error handling

#### 3. Fresh Middleware Tests

- **fresh/middleware/session.test.ts**

```typescript
assertEquals((retrievedSession as any).user.id, "123");
assertEquals((retrievedSession as any).user.email, "test@example.com");
```

- Test assertions: Session object cast as `any` to access properties

### Telemetry Tests

#### telemetry.test.ts

```typescript
instrumentWorkOSCore(mockWorkos as any);
instrumentSSO(mockSso as any);
instrumentDirectorySync(mockDirectorySync as any);
instrumentUserManagement(mockUserManagement as any);
```

- Mock objects: Multiple mock service instances cast as `any` for
  instrumentation

### Utility Files

#### 1. test_helpers.ts

```typescript
(workos as any).client = client;
```

- Mock objects: WorkOS client property set through type assertion

#### 2. test-utils.ts

```typescript
errorClass?: new (...args: any[]) => Error,
```

- Helper utilities: Error class constructor parameters typed as `any[]`

#### 3. mock_data.ts

```typescript
params?: Record<string, string | any>;
body?: any;
```

- Mock objects: Request body typed as `any`

### Codegen Tests

#### 1. runtime_smoke.test.ts

```typescript
(globalThis as any).__testRequestInfo = {
```

```typescript
(globalThis as any).fetch = mockFetch;
```

```typescript
delete (globalThis as any).__testRequestInfo;
delete (globalThis as any).__restoreFetch;
```

```typescript
const restoreFn = (globalThis as any).__restoreFetch as () => void;
```

```typescript
const requestInfo = (globalThis as any).__testRequestInfo as TestRequestInfo;
```

- Mock objects: Global object properties cast as `any` for testing

#### 2. Generated Test Files

- **codegen/_runtime_strict_output/core/test.ts**
- **codegen/_runtime_output/core/test.ts**

```typescript
field1: any;
field2: any[];
callback: (param: any) => any;
```

- Interface definitions: Test interface properties typed as `any`

- **codegen/_runtime_test_output/core/ApiRequestOptions.ts**

```typescript
readonly formData?: Record<string, any>;
readonly body?: any;
```

- Request objects: API request body typed as `any`

- **codegen/_runtime_test_output/core/ApiResult.ts**

```typescript
readonly body: any;
```

- Response objects: API response body typed as `any`

- **codegen/_runtime_test_output/core/ApiError.ts**

```typescript
public readonly body: any;
```

- Response objects: API error body typed as `any`

## Summary

### Patterns of `any` Usage

#### 1. Mock Objects

- Action arrays in example routes
- Mock service instances in telemetry tests
- Global object properties in runtime tests

#### 2. Test Context Objects

- Session options in test files
- Component properties in hydration tests

#### 3. Helper Utilities

- Error class constructors in test utilities
- Hydration simulation functions

#### 4. Response/Request Objects

- API request/response bodies in codegen tests
- Data arrays in hooks

The most common patterns are type assertions (`as any`) used to bypass type
checking for testing purposes, and interface properties explicitly typed as
`any` in test interfaces.
