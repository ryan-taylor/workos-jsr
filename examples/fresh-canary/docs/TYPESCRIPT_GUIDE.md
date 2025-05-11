# TypeScript Guide for Fresh 2.x Canary

This guide provides best practices for using TypeScript with Fresh 2.x Canary and optimizing for Deno Deploy.

## TypeScript Configuration

Fresh 2.x Canary uses TypeScript for type safety and better developer experience. The TypeScript configuration is defined in the `deno.json` file:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "strict": true,
    "lib": ["dom", "dom.iterable", "dom.asynciterable", "deno.ns"]
  }
}
```

### Key Configuration Options

- **jsx**: Set to `react-jsx` to use the automatic JSX runtime, which eliminates the need to import `h` from Preact in every file.
- **jsxImportSource**: Set to `preact` to use Preact as the JSX runtime.
- **strict**: Enables strict type checking for better code quality.
- **lib**: Includes necessary type definitions for DOM, async operations, and Deno-specific APIs.

## Component Typing Best Practices

### Route Components

Route components should use the `PageProps` type from Fresh:

```typescript
import type { PageProps } from "$fresh/server.ts";

interface RouteData {
  user: User | null;
  items: Item[];
}

export default function MyRoute({ data }: PageProps<RouteData>) {
  // Component implementation
}
```

### Island Components

Island components should have well-defined prop interfaces:

```typescript
interface MyComponentProps {
  initialValue: number;
  label: string;
  onChange?: (value: number) => void;
}

export default function MyComponent({ initialValue, label, onChange }: MyComponentProps) {
  // Component implementation
}
```

### Handler Functions

Handler functions should use the `Handlers` type from Fresh:

```typescript
import type { Handlers } from "$fresh/server.ts";

interface HandlerData {
  items: Item[];
}

export const handler: Handlers<HandlerData> = {
  async GET(req, ctx) {
    // Handler implementation
    return ctx.render({ items });
  },
  async POST(req, ctx) {
    // Handler implementation
    return new Response(null, { status: 303, headers: { Location: "/" } });
  }
};
```

## Event Handling

When handling events in components, use proper TypeScript typing:

```typescript
// For input events
const handleInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  // Process value
};

// For form submissions
const handleSubmit = (e: Event) => {
  e.preventDefault();
  // Form submission logic
};
```

For reusable event handlers, use higher-order functions:

```typescript
const handleInputChange = (setter: (value: string) => void) => (e: Event) => {
  const target = e.target as HTMLInputElement;
  setter(target.value);
};

// Usage
<input onInput={handleInputChange(setName)} />
```

## Deno Deploy Optimization

### Import Maps

Use import maps to ensure compatibility with Deno Deploy:

```json
{
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.6.5/",
    "preact": "https://esm.sh/preact@10.19.3",
    "preact/": "https://esm.sh/preact@10.19.3/",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.2.2",
    "$std/": "https://deno.land/std@0.220.0/"
  }
}
```

### Server Configuration

Optimize server configuration for Deno Deploy:

```typescript
// fresh.config.ts
export default defineConfig({
  server: {
    port: 8000,
    hostname: "0.0.0.0",
  },
  router: {
    trailingSlash: false,
  }
});
```

### Environment Variables

Use Deno's built-in environment variable handling:

```typescript
// Access environment variables
const apiKey = Deno.env.get("API_KEY");
const isDev = Deno.env.get("ENVIRONMENT") === "development";
```

## Linting Strategy

### Recommended Linting Rules

1. **Use explicit types for function parameters and return values**:
   ```typescript
   function calculateTotal(items: Item[]): number {
     return items.reduce((sum, item) => sum + item.price, 0);
   }
   ```

2. **Use interfaces for object shapes**:
   ```typescript
   interface User {
     id: string;
     name: string;
     email: string;
     isAdmin?: boolean;
   }
   ```

3. **Use type guards for runtime type checking**:
   ```typescript
   function isUser(obj: unknown): obj is User {
     return (
       typeof obj === "object" &&
       obj !== null &&
       "id" in obj &&
       "name" in obj &&
       "email" in obj
     );
   }
   ```

4. **Use discriminated unions for state management**:
   ```typescript
   type RequestState =
     | { status: "idle" }
     | { status: "loading" }
     | { status: "success", data: ResponseData }
     | { status: "error", error: Error };
   ```

5. **Use readonly for immutable data**:
   ```typescript
   interface Config {
     readonly apiUrl: string;
     readonly timeout: number;
   }
   ```

### Accessibility

Ensure components have proper accessibility attributes:

```typescript
<button
  type="submit"
  disabled={isSubmitting}
  aria-busy={isSubmitting}
>
  {isSubmitting ? "Submitting..." : "Submit"}
</button>

<div role="alert" class="error-message">
  {errorMessage}
</div>
```

## Common TypeScript Patterns

### Nullable Types

Use union types with `null` for nullable values:

```typescript
function getUserName(user: User | null): string {
  return user ? user.name : "Guest";
}
```

### Optional Properties

Use optional properties with the `?` operator:

```typescript
interface FormOptions {
  validateOnChange?: boolean;
  submitOnEnter?: boolean;
}
```

### Type Assertions

Use type assertions when necessary, but prefer type guards:

```typescript
// Type assertion (use sparingly)
const value = event.target as HTMLInputElement;

// Better: Type guard
if (event.target instanceof HTMLInputElement) {
  const value = event.target.value;
}
```

## Conclusion

Following these TypeScript best practices will help ensure your Fresh 2.x Canary application is type-safe, maintainable, and optimized for Deno Deploy. TypeScript provides valuable tooling and developer experience improvements that make your code more robust and easier to refactor.