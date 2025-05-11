// API endpoint to create a new role
import type { Handlers } from '$fresh/server.ts';
import { createRole, type RoleCreateParams } from '../../../utils/roles.ts';
import { requireAuth } from '../../../utils/user-management.ts';

export const handler: Handlers = {
  async POST(req, _ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    try {
      // Parse request body
      const data = await req.json();

      // Validate required fields
      if (!data.name) {
        return new Response(
          JSON.stringify({ error: 'Name is required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (!data.permissions || !Array.isArray(data.permissions) || data.permissions.length === 0) {
        return new Response(
          JSON.stringify({ error: 'At least one permission is required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Create role params object
      const params: RoleCreateParams = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        permissions: data.permissions,
      };

      // Create the role
      const role = await createRole(params);

      return new Response(JSON.stringify(role), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating role:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Failed to create role',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
