# Generated Code

This directory contains code generated from the WorkOS OpenAPI specification.

## Important Notes

- **DO NOT MODIFY** files in this directory directly. Any changes will be
  overwritten when the code generation script is run again.
- The generated code is organized by API version date (e.g., `2025-05-12`).
- Each version directory contains:
  - `schemas.d.ts`: TypeScript types generated from the spec
  - `core/`: Fetch wrapper and error mapping code
  - `services/`: Per-endpoint functions
  - `index.ts`: Re-exports from core and services

## Code Generation

The code in this directory is generated using the `scripts/codegen/build.ts`
script.

To regenerate the code, run:

```bash
deno task generate:api
```

This will fetch the latest OpenAPI specification and generate the TypeScript
code accordingly.
