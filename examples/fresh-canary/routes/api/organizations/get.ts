import { Handlers } from "$fresh/server.ts";
import { workos } from "../../../utils/workos.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
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
    
    try {
      const organization = await workos.organizations.getOrganization(id);
      
      return new Response(
        JSON.stringify(organization),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error fetching organization:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch organization",
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