import { defineConfig } from "https://deno.land/x/fresh@2.2.0-canary.1/server.ts";
import tailwindPlugin from "https://deno.land/x/fresh@2.2.0-canary.1/plugins/tailwind.ts";

export default defineConfig({
  plugins: [
    tailwindPlugin({
      // Tailwind configuration (optional)
    }),
  ],
});
