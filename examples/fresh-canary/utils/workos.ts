// Initialize WorkOS client for the application
import { WorkOS } from "../../../src/workos.ts";

// Initialize the WorkOS SDK with API key from environment variables
const apiKey = Deno.env.get("WORKOS_API_KEY");
if (apiKey === null) {
  throw new Error("Environment variable WORKOS_API_KEY is required");
}

export const workos = new WorkOS(
  apiKey,
  {
    clientId: Deno.env.get("WORKOS_CLIENT_ID") ?? undefined,
    apiHostname: Deno.env.get("WORKOS_API_HOSTNAME") ?? undefined,
  },
);
