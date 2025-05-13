// Initialize WorkOS client for the application
import { WorkOS } from 'workos';

// Initialize the WorkOS SDK with API key from environment variables
export const workos = new WorkOS(
  Deno.env.get('WORKOS_API_KEY') ?? '',
  {
    clientId: Deno.env.get('WORKOS_CLIENT_ID') ?? undefined,
    apiHostname: Deno.env.get('WORKOS_API_HOSTNAME') ?? undefined,
  },
);
