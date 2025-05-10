// API endpoint to generate Admin Portal links
import { Handlers } from "$fresh/server.ts";
import { generatePortalLink, PortalLinkOptions, GeneratePortalLinkIntent } from "../../../utils/portal.ts";

// Interface for the request body
interface GeneratePortalLinkRequest {
  intent: GeneratePortalLinkIntent;
  organization: string;
  returnUrl?: string;
  successUrl?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    headerText?: string;
  };
}

export const handler: Handlers = {
  async POST(req) {
    try {
      // Parse request body
      const body: GeneratePortalLinkRequest = await req.json();
      
      // Validate required fields
      if (!body.organization) {
        return new Response(
          JSON.stringify({ error: "Organization ID is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      if (!Object.values(GeneratePortalLinkIntent).includes(body.intent)) {
        return new Response(
          JSON.stringify({ error: "Invalid portal intent" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Generate the portal link
      const link = await generatePortalLink({
        intent: body.intent,
        organization: body.organization,
        returnUrl: body.returnUrl,
        successUrl: body.successUrl,
      });
      
      // Return the generated link
      return new Response(
        JSON.stringify({ link }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error generating portal link:", error);
      
      // Return error response
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : "An error occurred while generating the portal link" 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};