// Generic Webhook Listener for WorkOS events
// This endpoint receives and processes all types of webhook events

import { getWebhookEvents, initWebhooks, storeWebhookEvent } from "../../../utils/webhook-events.ts";

// Handler for WorkOS webhook events
export async function POST(req: Request): Promise<Response> {
  try {
    const { webhooks } = initWebhooks();
    const bodyText = await req.text();
    let payload;
    
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      console.error("Failed to parse webhook payload:", e);
      return new Response("Invalid JSON payload", { status: 400 });
    }
    
    const sigHeader = req.headers.get("workos-signature") || "";
    
    // Get webhook secret from environment variable
    const webhookSecret = Deno.env.get("WORKOS_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("WORKOS_WEBHOOK_SECRET environment variable not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }
    
    let event;
    let verified = false;
    
    try {
      // Verify webhook signature and parse event
      event = await webhooks.constructEvent({
        payload,
        sigHeader,
        secret: webhookSecret,
      });
      verified = true;
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      
      // For demo purposes, we'll still process the event but mark it as unverified
      // In production, you would typically reject unverified webhooks
      event = {
        id: payload.id || "unknown",
        event: payload.event || "unknown",
        data: payload.data || {},
        createdAt: payload.created_at || new Date().toISOString(),
      };
      verified = false;
    }
    
    // Store the event for display in the UI
    storeWebhookEvent(event, bodyText, verified);
    
    // Process different event types
    console.log(`Received webhook event: ${event.event}`);
    
    // Handle the event based on its type
    switch (event.event) {
      // User Management Events
      case "user.created":
      case "user.updated":
      case "user.deleted":
        console.log(`User event: ${event.event}`, event.data.id);
        break;
        
      // Authentication Events
      case "authentication.succeeded":
      case "authentication.failed":
        console.log(`Authentication event: ${event.event}`);
        break;
        
      // Directory Sync Events
      case "dsync.user.created":
      case "dsync.user.updated":
      case "dsync.user.deleted":
        console.log(`Directory user event: ${event.event}`, event.data.id);
        break;
        
      case "dsync.group.created":
      case "dsync.group.updated":
      case "dsync.group.deleted":
        console.log(`Directory group event: ${event.event}`, event.data.id);
        break;
        
      // Organization Events
      case "organization.created":
      case "organization.updated":
      case "organization.deleted":
        console.log(`Organization event: ${event.event}`, event.data.id);
        break;
        
      // Default handler for other event types
      default:
        console.log(`Other event type: ${event.event}`);
    }
    
    // Return success response
    return new Response(JSON.stringify({ received: true, id: event.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handler for GET requests - returns recent webhook events
export function GET(req: Request): Response {
  try {
    // Parse query parameters for filtering
    const url = new URL(req.url);
    const eventType = url.searchParams.get("eventType") || undefined;
    const startTime = url.searchParams.get("startTime") || undefined;
    const endTime = url.searchParams.get("endTime") || undefined;
    
    // Get filtered events
    const events = getWebhookEvents({
      eventType: eventType,
      startTime: startTime,
      endTime: endTime,
    });
    
    // Return events as JSON
    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error retrieving webhook events:", error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}