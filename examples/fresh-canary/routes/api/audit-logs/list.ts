import type { Handlers } from "$fresh/server.ts";
import { getMockAuditLogs } from "../../../utils/audit-logs.ts";
import { requireAuth } from "../../../utils/user-management.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    // Ensure user is authenticated
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    try {
      // Parse query parameters
      const url = new URL(req.url);

      // Filter parameters
      const actions = url.searchParams.get("actions")?.split(",") || [];
      const actorNames = url.searchParams.get("actorNames")?.split(",") || [];
      const organizationId = url.searchParams.get("organizationId") ||
        undefined;

      // Date range parameters
      const rangeStartParam = url.searchParams.get("rangeStart");
      const rangeEndParam = url.searchParams.get("rangeEnd");

      const rangeStart = rangeStartParam
        ? new Date(rangeStartParam)
        : undefined;
      const rangeEnd = rangeEndParam ? new Date(rangeEndParam) : undefined;

      // Pagination parameters
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);

      // Fetch audit logs with filters
      const auditLogs = await getMockAuditLogs({
        actions: actions.length > 0 ? actions : undefined,
        actorNames: actorNames.length > 0 ? actorNames : undefined,
        organizationId,
        rangeStart,
        rangeEnd,
        page,
        limit,
      });

      // Return success response
      return new Response(
        JSON.stringify({
          status: "success",
          data: auditLogs.data,
          pagination: {
            page,
            limit,
            totalCount: auditLogs.totalCount,
            hasMore: auditLogs.hasMore,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.error("Error fetching audit logs:", error);

      // Return error response
      return new Response(
        JSON.stringify({
          status: "error",
          message: error instanceof Error
            ? error.message
            : "Failed to fetch audit logs",
          code: "AUDIT_LOGS_FETCH_ERROR",
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
