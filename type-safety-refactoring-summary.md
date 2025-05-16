# Type Safety Refactoring: Summary of Changes

## Overview

We have completed a comprehensive effort to eliminate `any` usage across the
WorkOS SDK codebase, replacing it with either `unknown` or concrete types. This
effort significantly improves the type safety and developer experience when
using the SDK.

## Phased Approach

Our type safety refactoring project has been executed in four distinct phases:

### Phase 1: Enhanced Test Type Definitions

- Replaced `any` types in test interfaces with proper concrete types
- Improved type assertions in test code for better safety and clarity

### Phase 2: JWT and Authentication Types

- Added proper `JWTHeader` and `JWTPayload` interfaces
- Reduced reliance on type assertions for JWT operations

### Phase 3: Signature and Timestamp Types

- Created `SignaturePayload` and `SignatureTimestamp` types
- Strengthened typing in crypto-related functionality

### Phase 4: Metadata Types and Runtime Guards

- Implemented `MetadataValue` and `MetadataMap` types
- Added runtime type guard functions with appropriate JSDoc documentation
- Updated documentation to reflect type safety improvements

## Changes Made

### Core SDK Modules

1. **User Management Module**
   - Replaced test interface `any` with proper concrete types
   - Updated JWT verification test code to use correct types instead of type
     assertions

2. **Webhooks Module**
   - Improved test variables with more specific types

3. **Actions Module**
   - Replaced type assertions with proper interfaces for accessing properties in
     tests

4. **Common Module**
   - Strengthened types in HTTP client and networking code
   - Some `any` types remain in crypto/JWT-related functionality due to inherent
     dynamic nature

5. **FGA Module**
   - Majority of remaining `any` types are in this module due to API design that
     handles arbitrary metadata

### Test Utilities

- Updated test utility interfaces to use more specific types where possible
- Some `any` usage remains in test mocking code where dynamic behavior is
  required

### Examples and Fresh Routes

- Improved types in Fresh Canary example where possible
- Some `any` usage remains in routes that handle generic session data

## New Type Definitions

### JWT Types

#### JWTHeader

```typescript
export interface JWTHeader {
  alg: string; // Required: Algorithm used for signing
  typ?: string; // Optional: Type of token (usually "JWT")
  kid?: string; // Optional: Key ID
  [key: string]: unknown; // Allow for other custom headers
}
```

#### JWTPayload

```typescript
export interface JWTPayload {
  iss?: string; // Issuer
  sub?: string; // Subject
  aud?: string | string[]; // Audience
  exp?: number; // Expiration Time
  nbf?: number; // Not Before
  iat?: number; // Issued At
  jti?: string; // JWT ID
  [key: string]: unknown; // Allow for additional custom claims
}
```

### Signature Types

#### SignatureTimestamp

```typescript
export type SignatureTimestamp = number | string | Date;
```

#### SignaturePayload

```typescript
export type SignaturePayload = Record<string, unknown>;
```

### Metadata Types with Runtime Guards

#### MetadataValue

```typescript
export type MetadataValue =
  | string
  | number
  | boolean
  | MetadataValue[]
  | { [key: string]: MetadataValue };
```

#### MetadataMap

```typescript
export type MetadataMap = {
  [key: string]: MetadataValue;
};
```

#### Runtime Type Guards

We've implemented runtime type guards for safer handling of metadata:

```typescript
// Check if a value is a valid MetadataValue
if (isMetadataValue(value)) {
  // value is guaranteed to match the MetadataValue type
}

// Check if an object is a valid MetadataMap
if (isMetadataMap(metadata)) {
  // metadata is guaranteed to match the MetadataMap type
}
```

## Usage Examples

### Working with JWT Types

```typescript
import { JWTPayload, verifyJWT } from "./common/crypto/jwt-utils";

// Type-safe JWT verification
async function validateToken(token: string): Promise<JWTPayload> {
  try {
    const payload = await verifyJWT(token, "your-secret-key", {
      algorithms: ["HS256"],
      issuer: "workos-api",
    });

    // TypeScript knows the shape of payload
    if (payload.sub) {
      console.log(`Token for user: ${payload.sub}`);
    }

    return payload;
  } catch (err) {
    throw new Error(`Token validation failed: ${err.message}`);
  }
}
```

### Using Metadata Types

```typescript
import {
  isMetadataMap,
  MetadataMap,
} from "./common/interfaces/metadata-guards";

function processUserMetadata(metadata: unknown): MetadataMap {
  // Validate the metadata using runtime type guard
  if (!isMetadataMap(metadata)) {
    throw new Error("Invalid metadata format");
  }

  // Now TypeScript knows metadata is a valid MetadataMap
  if (metadata.preferences && Array.isArray(metadata.preferences)) {
    // Process preferences array
    metadata.preferences.forEach((pref) => console.log(pref));
  }

  return metadata;
}
```

## Maintaining Type Safety

For developers working with the codebase, follow these guidelines:

1. **Avoid `any`**: Use specific types instead of `any` whenever possible
2. **Use Type Guards**: For dynamic data, use the provided type guards or create
   new ones
3. **Leverage TypeScript Features**:
   - Use union types for variables that can be multiple types
   - Use `unknown` instead of `any` for truly unknown data, then use type guards
   - Use generics for functions that work with multiple types
4. **Runtime Validation**: When receiving external data, validate it against
   expected types
5. **JSDoc Comments**: Add clear JSDoc with examples for all public functions

## Remaining `any` Usage

We've documented the remaining `any` usage in `remaining-any-types.md`. These
instances fall into a few categories:

1. **API Requirements**: Some APIs genuinely need to handle arbitrary data
2. **Dynamic Behavior**: Some modules deal with unpredictable data structures
3. **Examples/Tests**: Some example code and test utilities retain `any` for
   flexibility

Many of the previous `any` types in JWT and metadata-related code have now been
replaced with proper types.

## Improvements and Benefits

1. **Type Safety**: The codebase is now significantly more type-safe, reducing
   potential runtime errors
2. **Developer Experience**: Better autocomplete and type checking for SDK users
3. **Code Quality**: More explicit typing reveals intent and improves code
   readability
4. **Maintenance**: Easier to maintain and refactor with stronger type
   guarantees
5. **Runtime Validation**: Added runtime type guards for dynamic data validation

## Follow-up Work

Future improvements could include:

1. Module-specific cleanup for FGA, which has the most remaining `any` usages
2. Further expansion of runtime type guards for other dynamic data structures
3. Addressing `any` usage in example code and test utilities
