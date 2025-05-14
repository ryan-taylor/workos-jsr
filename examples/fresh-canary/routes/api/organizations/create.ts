import type { Handlers } from "$fresh/server.ts";
import { workos } from "../../../utils/workos.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();

      // Validate required fields
      if (!body.name) {
        return new Response(
          JSON.stringify({ error: "Organization name is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Prepare payload
      const payload: {
        name: string;
        allow_profiles_outside_organization: boolean;
        external_id?: string;
        metadata?: Record<string, string>;
      } = {
        name: body.name,
        allow_profiles_outside_organization:
          body.allowProfilesOutsideOrganization || false,
      };

      // Add optional fields if provided
      if (body.externalId) {
        payload.external_id = body.externalId;
      }

      if (body.metadata && Object.keys(body.metadata).length > 0) {
        payload.metadata = body.metadata;
      }

      // Create organization
      const organization = await workos.organizations.createOrganization(
        payload,
      );

      return new Response(
        JSON.stringify(organization),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.error("Error creating organization:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);

      return new Response(
        JSON.stringify({
          error: "Failed to create organization",
          details: errorMessage,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  },
};
