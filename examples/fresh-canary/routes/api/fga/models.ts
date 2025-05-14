import type { HandlerContext } from "$fresh/server.ts";
import {
  createRelationship,
  createResource,
  deleteRelationship,
  deleteResource,
  exampleModels,
  listResources,
  updateResource,
} from "../../../utils/fga.ts";

// Fetch all authorization models
export const handler = {
  async GET(_req: Request, _ctx: HandlerContext): Promise<Response> {
    try {
      // Just return the example models for the demo
      return new Response(
        JSON.stringify({
          resources: await listResources(),
          examples: exampleModels,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error occurred";
      console.error("Error fetching FGA models:", errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req: Request, _ctx: HandlerContext): Promise<Response> {
    try {
      const body = await req.json();

      if (body.op === "create") {
        // Create a new resource
        const resource = await createResource(body.resource);
        return new Response(JSON.stringify(resource), {
          headers: { "Content-Type": "application/json" },
        });
      } else if (body.op === "update") {
        // Update an existing resource
        const resource = await updateResource(body.resource, body.meta);
        return new Response(JSON.stringify(resource), {
          headers: { "Content-Type": "application/json" },
        });
      } else if (body.op === "delete") {
        // Delete a resource
        await deleteResource(body.resource);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } else if (body.op === "createRelationship") {
        // Create a relationship between resources
        const warrant = await createRelationship(body.relationship);
        return new Response(JSON.stringify(warrant), {
          headers: { "Content-Type": "application/json" },
        });
      } else if (body.op === "deleteRelationship") {
        // Delete a relationship between resources
        const warrant = await deleteRelationship(body.relationship);
        return new Response(JSON.stringify(warrant), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid operation" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error occurred";
      console.error("Error updating FGA model:", errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
