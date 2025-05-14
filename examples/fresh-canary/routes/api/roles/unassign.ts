// API endpoint to unassign a role from a user
import type { Handlers } from "$fresh/server.ts";
import {
  type RoleAssignmentParams,
  unassignRole,
} from "../../../utils/roles.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    try {
      // Parse request body
      const data = await req.json();

      // Validate required fields
      if (!data.userId) {
        return new Response(
          JSON.stringify({ error: "User ID is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (!data.roleId) {
        return new Response(
          JSON.stringify({ error: "Role ID is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Create params object
      const params: RoleAssignmentParams = {
        userId: data.userId,
        roleId: data.roleId,
      };

      // Unassign the role from the user
      const result = await unassignRole(params);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error unassigning role:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error
            ? error.message
            : "Failed to unassign role",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
