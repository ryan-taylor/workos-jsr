// Directory Sync webhook handler for Fresh

import { initWebhooks } from "../../../utils/directory-sync.ts";

// Handler for WorkOS Directory Sync webhook events
export async function POST(req: Request): Promise<Response> {
  try {
    const { webhooks } = initWebhooks();
    const payload = await req.json();
    const sigHeader = req.headers.get("workos-signature") || "";
    
    // Get webhook secret from environment variable
    const webhookSecret = Deno.env.get("WORKOS_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("WORKOS_WEBHOOK_SECRET environment variable not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }
    
    // Verify webhook signature and parse event
    const event = await webhooks.constructEvent({
      payload,
      sigHeader,
      secret: webhookSecret,
    });
    
    // Process the event based on its type
    switch (event.event) {
      case "dsync.user.created":
        // Handle user creation event
        console.log("Directory user created:", event.data.id);
        // Implement your user creation logic here
        break;
        
      case "dsync.user.updated":
        // Handle user update event
        console.log("Directory user updated:", event.data.id);
        // Implement your user update logic here
        break;
        
      case "dsync.user.deleted":
        // Handle user deletion event
        console.log("Directory user deleted:", event.data.id);
        // Implement your user deletion logic here
        break;
        
      case "dsync.group.created":
        // Handle group creation event
        console.log("Directory group created:", event.data.id);
        // Implement your group creation logic here
        break;
        
      case "dsync.group.updated":
        // Handle group update event
        console.log("Directory group updated:", event.data.id);
        // Implement your group update logic here
        break;
        
      case "dsync.group.deleted":
        // Handle group deletion event
        console.log("Directory group deleted:", event.data.id);
        // Implement your group deletion logic here
        break;
        
      case "dsync.group.user_added":
        // Handle user added to group event
        console.log(`User ${event.data.user.id} added to group ${event.data.group.id}`);
        // Implement your user-group addition logic here
        break;
        
      case "dsync.group.user_removed":
        // Handle user removed from group event
        console.log(`User ${event.data.user.id} removed from group ${event.data.group.id}`);
        // Implement your user-group removal logic here
        break;
        
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }
    
    // Return a success response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    
    // Return an error response
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}