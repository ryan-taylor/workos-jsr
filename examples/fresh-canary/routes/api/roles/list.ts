// API endpoint to list all roles
import { Handlers } from "$fresh/server.ts";
import { listRoles } from "../../../utils/roles.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    try {
      const roles = await listRoles();
      return new Response(JSON.stringify(roles), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to list roles"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};