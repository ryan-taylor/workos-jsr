import type { Handlers } from "$fresh/server.ts";
import type { workos } from "../../../utils/workos.ts";

// For this demo, we'll use an in-memory store for actions
// In a real application, you would use a database
declare global {
  interface Window {
    __ACTIONS_STORE__: Map<string, any>;
  }
}

// Initialize the actions store if it doesn't exist
if (!globalThis.__ACTIONS_STORE__) {
  globalThis.__ACTIONS_STORE__ = new Map();
}

export const handler: Handlers = {
  async POST(req) {
    try {
      // Parse the request body
      const body = await req.json();

      // Validate the request body (simplified for this demo)
      if (
        !body.type || !body.user?.email || !body.user?.firstName ||
        !body.user?.lastName
      ) {
        return new Response(
          JSON.stringify({
            status: "error",
            message:
              "Invalid request data - type and user details are required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // In a real application, you would use the WorkOS SDK to create an action
      // For this demo, we'll create a mock action

      // Generate a unique ID
      const id = crypto.randomUUID();

      // Create the action object
      const action = {
        id,
        type: body.type,
        status: "pending",
        createdAt: new Date(),
        user: {
          id: crypto.randomUUID(),
          email: body.user.email,
          firstName: body.user.firstName,
          lastName: body.user.lastName,
        },
        context: {
          organization: body.organization
            ? {
              id: crypto.randomUUID(),
              name: body.organization.name,
            }
            : undefined,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent"),
          deviceFingerprint: crypto.randomUUID().substring(0, 16),
        },
        metadata: body.metadata,
      };

      // Store the action
      globalThis.__ACTIONS_STORE__.set(id, action);

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Action created successfully",
          data: action,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error creating action:", error);

      return new Response(
        JSON.stringify({
          status: "error",
          message: error instanceof Error
            ? error.message
            : "An unknown error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
