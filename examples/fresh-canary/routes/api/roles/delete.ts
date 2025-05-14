// API endpoint to delete a role
import type { Handlers } from "$fresh/server.ts";
import { deleteRole } from "../../../utils/roles.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handlers = {
  async DELETE(req, _ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    // Get role ID from URL
    const url = new URL(req.url);
    const roleId = url.searchParams.get("id");

    if (!roleId) {
      return new Response(
        JSON.stringify({ error: "Role ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      // Delete the role
      const result = await deleteRole(roleId);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`Error deleting role ${roleId}:`, error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error
            ? error.message
            : `Failed to delete role ${roleId}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
