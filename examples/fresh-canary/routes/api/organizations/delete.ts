import { Handlers } from "$fresh/server.ts";
import { workos } from "../../../utils/workos.ts";

export const handler: Handlers = {
  async DELETE(req) {
    try {
      // Handle two cases:
      // 1. Query param: /api/organizations/delete?id=org_123
      // 2. JSON body: { "id": "org_123" }
      
      let organizationId: string | null = null;
      
      // First check query param
      const url = new URL(req.url);
      organizationId = url.searchParams.get("id");
      
      // If not in query param, try to get from body
      if (!organizationId) {
        try {
          const body = await req.json();
          organizationId = body.id || null;
        } catch (err) {
          // If body parsing fails, just continue with null id
        }
      }
      
      // Validate required fields
      if (!organizationId) {
        return new Response(
          JSON.stringify({ error: "Organization ID is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      // Delete organization
      await workos.organizations.deleteOrganization(organizationId);
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error deleting organization:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete organization",
          details: errorMessage
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};