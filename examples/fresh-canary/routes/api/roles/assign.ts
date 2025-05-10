// API endpoint to assign a role to a user
import { Handlers } from "$fresh/server.ts";
import { assignRole, RoleAssignmentParams } from "../../../utils/roles.ts";
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
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      if (!data.roleId) {
        return new Response(
          JSON.stringify({ error: "Role ID is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Create params object
      const params: RoleAssignmentParams = {
        userId: data.userId,
        roleId: data.roleId
      };
      
      // Assign the role to the user
      const result = await assignRole(params);
      
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error assigning role:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to assign role"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};