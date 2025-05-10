import { defineConfig } from "$fresh/server.ts";

// Configuration optimized for Deno Deploy
export default defineConfig({
  plugins: [],
  
  // Better URL handling in edge environments
  router: {
    trailingSlash: false,
  }
});