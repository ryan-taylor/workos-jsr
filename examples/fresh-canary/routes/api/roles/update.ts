// API endpoint to update an existing role
import type { Handlers } from "$fresh/server.ts";
import { type RoleUpdateParams, updateRole } from "../../../utils/roles.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handlers = {
  async PUT(req, _ctx) {
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
      // Parse request body
      const data = await req.json();

      // Create update params object
      const params: RoleUpdateParams = {};

      // Only include fields that are provided
      if (data.name !== undefined) params.name = data.name;
      if (data.slug !== undefined) params.slug = data.slug;
      if (data.description !== undefined) params.description = data.description;
      if (data.permissions !== undefined) params.permissions = data.permissions;

      // Ensure we have at least one field to update
      if (Object.keys(params).length === 0) {
        return new Response(
          JSON.stringify({ error: "No fields provided for update" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Update the role
      const role = await updateRole(roleId, params);

      return new Response(JSON.stringify(role), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`Error updating role ${roleId}:`, error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error
            ? error.message
            : `Failed to update role ${roleId}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
