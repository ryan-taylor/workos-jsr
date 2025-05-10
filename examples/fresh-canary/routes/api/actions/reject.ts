import { Handlers } from "$fresh/server.ts";
import { workos } from "../../../utils/workos.ts";

// For this demo, we'll use the in-memory store for actions
declare global {
  interface Window {
    __ACTIONS_STORE__: Map<string, any>;
  }
}

export const handler: Handlers = {
  async POST(req) {
    try {
      // Parse the request body
      const body = await req.json();
      
      // Validate the action ID
      if (!body.id) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Action ID is required"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      // Check if the action exists
      if (!window.__ACTIONS_STORE__) {
        window.__ACTIONS_STORE__ = new Map();
      }
      
      const action = window.__ACTIONS_STORE__.get(body.id);
      
      if (!action) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Action not found"
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      // Check if the action is already processed
      if (action.status !== "pending") {
        return new Response(
          JSON.stringify({
            status: "error",
            message: `Action has already been ${action.status}`
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      // In a real application, you would use the WorkOS SDK to reject the action
      // For this demo, we'll update the action in our store
      
      // Create a mock approver (rejector in this case)
      const approver = {
        id: crypto.randomUUID(),
        email: "approver@example.com",
        firstName: "Demo",
        lastName: "Approver"
      };
      
      // Update the action
      action.status = "rejected";
      action.approver = approver;
      action.rejectedAt = new Date();
      
      // Add rejection reason if provided
      if (body.reason) {
        action.reason = body.reason;
      }
      
      // Store the updated action
      window.__ACTIONS_STORE__.set(body.id, action);
      
      return new Response(
        JSON.stringify({
          status: "success",
          message: "Action rejected successfully",
          data: action
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error rejecting action:", error);
      
      return new Response(
        JSON.stringify({
          status: "error",
          message: error instanceof Error ? error.message : "An unknown error occurred"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
};