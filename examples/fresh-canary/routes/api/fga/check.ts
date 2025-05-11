import type { HandlerContext } from '$fresh/server.ts';
import { checkRelationship, queryRelationships, type RelationshipDefinition } from '../../../utils/fga.ts';

// Check authorization relationship
export const handler = {
  async POST(req: Request, _ctx: HandlerContext): Promise<Response> {
    try {
      const body = await req.json();

      if (body.op === 'check') {
        // Check a single relationship
        const relationship: RelationshipDefinition = {
          resource: {
            resourceType: body.resourceType,
            resourceId: body.resourceId,
          },
          relation: body.relation,
          subject: {
            resourceType: body.subjectType,
            resourceId: body.subjectId,
          },
        };

        const result = await checkRelationship(relationship);

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (body.op === 'query') {
        // Query relationships
        const results = await queryRelationships(body.query);

        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid operation' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error checking FGA relationship:', errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
