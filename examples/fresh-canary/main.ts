import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import { wrapMw } from "@workos/fresh/middleware.ts";
import { makeRouter } from "@workos/fresh/router.ts";
import { getTailwindPlugin } from "@workos/fresh/plugins/tailwind.ts";

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
