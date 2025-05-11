// API endpoint to get a single role by ID
import type { Handlers } from '$fresh/server.ts';
import { getRole } from '../../../utils/roles.ts';
import { requireAuth } from '../../../utils/user-management.ts';

export const handler: Handlers = {
  async GET(req, _ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    // Get role ID from URL
    const url = new URL(req.url);
    const roleId = url.searchParams.get('id');

    if (!roleId) {
      return new Response(
        JSON.stringify({ error: 'Role ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    try {
      const role = await getRole(roleId);
      return new Response(JSON.stringify(role), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error(`Error fetching role ${roleId}:`, error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : `Failed to get role ${roleId}`,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
