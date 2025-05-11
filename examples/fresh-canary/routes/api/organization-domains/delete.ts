import { deleteDomain } from '../../../utils/organization-domains.ts';

export const handler = {
  async DELETE(req: Request) {
    try {
      const url = new URL(req.url);
      const domainId = url.searchParams.get('id');

      if (!domainId) {
        return new Response(
          JSON.stringify({
            message: 'Domain ID is required',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      await deleteDomain(domainId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error deleting domain:', error);
      return new Response(
        JSON.stringify({
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
