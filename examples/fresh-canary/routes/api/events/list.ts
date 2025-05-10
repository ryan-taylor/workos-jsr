import { Handlers } from "$fresh/server.ts";
import { workos } from "../../../utils/workos.ts";
import { requireAuth } from "../../../utils/user-management.ts";
import { EventName } from "../../../../../src/common/interfaces/event.interface.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    // Ensure user is authenticated
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    try {
      // Parse query parameters
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const after = url.searchParams.get("after") || undefined;
      const organizationId = url.searchParams.get("organization_id") || undefined;
      const rangeStart = url.searchParams.get("range_start") || undefined;
      const rangeEnd = url.searchParams.get("range_end") || undefined;
      
      // Parse event types for filtering
      const events = url.searchParams.get("events") 
        ? url.searchParams.get("events")!.split(",") as EventName[]
        : [];

      const eventsList = await workos.events.listEvents({
        limit,
        after,
        organizationId,
        rangeStart,
        rangeEnd,
        events: events.length > 0 ? events : undefined,
      });

      return new Response(JSON.stringify({
        status: "success",
        data: eventsList.data,
        listMetadata: eventsList.listMetadata
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: error instanceof Error ? error.message : "Failed to fetch events", 
          code: "EVENTS_FETCH_ERROR"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};