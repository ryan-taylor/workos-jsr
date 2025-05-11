import type { Handlers } from '$fresh/server.ts';
import { getCurrentUser, initUserManagement, requireAuth } from '../../utils/user-management.ts';

export const handler: Handlers = {
  async GET(req, _ctx) {
    try {
      // Check if user is authenticated
      const redirectResponse = await requireAuth(req);
      if (redirectResponse) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get current user
      const user = await getCurrentUser(req);
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get query parameters - allow passing userId for validation
      const url = new URL(req.url);
      const requestedUserId = url.searchParams.get('userId');

      // Validate that the requested user ID matches the authenticated user
      if (requestedUserId && requestedUserId !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Initialize user management
      const { userManagement } = initUserManagement();

      // Get authentication factors
      const factorsResult = await userManagement.listAuthFactors({ userId: user.id });

      return new Response(JSON.stringify(factorsResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching auth factors:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch authentication factors' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
