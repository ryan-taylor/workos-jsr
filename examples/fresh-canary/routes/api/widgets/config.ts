// API endpoint to generate Widget configuration and tokens
import type { Handlers } from "$fresh/server.ts";
import {
  generateWidgetToken,
  WidgetTheme,
  WidgetType,
} from "../../../utils/widgets.ts";

// Interface for the request body
interface WidgetConfigRequest {
  organizationId: string;
  userId: string;
  widgetType: WidgetType;
  theme?: WidgetTheme;
  customization?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  customCss?: string;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      // Parse request body
      const body: WidgetConfigRequest = await req.json();

      // Validate required fields
      if (!body.organizationId) {
        return new Response(
          JSON.stringify({ error: "Organization ID is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!body.userId) {
        return new Response(
          JSON.stringify({ error: "User ID is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!Object.values(WidgetType).includes(body.widgetType)) {
        return new Response(
          JSON.stringify({ error: "Invalid widget type" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Generate the widget token
      const token = await generateWidgetToken({
        organizationId: body.organizationId,
        userId: body.userId,
        widgetType: body.widgetType,
      });

      // Return the generated token along with configuration
      return new Response(
        JSON.stringify({
          token,
          config: {
            type: body.widgetType,
            theme: body.theme || WidgetTheme.LIGHT,
            customization: body.customization,
            customCss: body.customCss,
          },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Error generating widget configuration:", error);

      // Return error response
      return new Response(
        JSON.stringify({
          error: error instanceof Error
            ? error.message
            : "An error occurred while generating the widget configuration",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
