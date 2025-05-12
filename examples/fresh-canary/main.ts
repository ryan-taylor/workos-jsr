import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import { wrapMw, makeRouter, getTailwindPlugin } from "@workos/fresh";

const router = makeRouter({
  apiKey: Deno.env.get("WORKOS_API_KEY") || "",
  cookieName: "workos_session",
});

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
