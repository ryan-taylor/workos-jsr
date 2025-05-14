import type { Handlers } from "$fresh/server.ts";
import { workos } from "../../../utils/workos.ts";

export const handler: Handlers = {
  async PUT(req) {
    try {
      const body = await req.json();

      // Validate required fields
      if (!body.id) {
        return new Response(
          JSON.stringify({ error: "Organization ID is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Prepare update options
      const updateOptions: {
        organization: string;
        name?: string;
        allowProfilesOutsideOrganization?: boolean;
        externalId?: string;
        metadata?: Record<string, string>;
      } = {
        organization: body.id,
      };

      // Add fields to update if provided
      if (body.name !== undefined) {
        updateOptions.name = body.name;
      }

      if (body.allowProfilesOutsideOrganization !== undefined) {
        updateOptions.allowProfilesOutsideOrganization =
          body.allowProfilesOutsideOrganization;
      }

      if (body.externalId !== undefined) {
        updateOptions.externalId = body.externalId;
      }

      if (body.metadata !== undefined) {
        updateOptions.metadata = body.metadata;
      }

      // Update organization
      const organization = await workos.organizations.updateOrganization(
        updateOptions,
      );

      return new Response(
        JSON.stringify(organization),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.error("Error updating organization:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);

      return new Response(
        JSON.stringify({
          error: "Failed to update organization",
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
