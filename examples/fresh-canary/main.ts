import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import { wrapMw, makeRouter, getTailwindPlugin } from "@workos/fresh";

// Create a router with proper routes array
const router = await makeRouter([
  {
    pattern: "/",
    handler: () => new Response("🏃 Fresh-canary alive"),
  },
]);

await start(manifest, {
  plugins: [getTailwindPlugin()],
  router,
  middleware: [
    wrapMw({
      apiKey: Deno.env.get("WORKOS_API_KEY") || "",
      cookieName: "workos_session",
    }),
  ],
});
