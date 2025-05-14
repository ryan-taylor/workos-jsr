import type { FunctionComponent } from "preact";
import type { Handlers, PageProps } from "$fresh/server.ts";
import {
  type AuditLogEvent,
  getMockAuditLogs,
  getUniqueActionTypes,
  getUniqueActorNames,
} from "../../utils/audit-logs.ts";
import { requireAuth } from "../../utils/user-management.ts";
import AuditLogsList from "../../islands/AuditLogsList.tsx";

interface AuditLogsPageData {
  logs: AuditLogEvent[];
  totalCount: number;
  uniqueActionTypes: string[];
  uniqueActorNames: string[];
  error?: string;
}

export const handler: Handlers<AuditLogsPageData> = {
  async GET(req, ctx) {
    // Require authentication
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    try {
      // Get audit logs with default settings for initial load
      const result = await getMockAuditLogs({
        page: 1,
        limit: 10,
      });

      // Get all logs (without pagination) to extract unique values for filters
      const allLogs = await getMockAuditLogs({
        limit: 1000,
      });

      // Get unique action types and actor names for filter dropdowns
      const uniqueActionTypes = getUniqueActionTypes(allLogs.data);
      const uniqueActorNames = getUniqueActorNames(allLogs.data);

      // Return data to the page
      return ctx.render({
        logs: result.data,
        totalCount: result.totalCount,
        uniqueActionTypes,
        uniqueActorNames,
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return ctx.render({
        logs: [],
        totalCount: 0,
        uniqueActionTypes: [],
        uniqueActorNames: [],
        error: error instanceof Error
          ? error.message
          : "Failed to load audit logs",
      });
    }
  },
};

const AuditLogsPage: FunctionComponent<PageProps<AuditLogsPageData>> = (
  { data },
) => {
  const { logs, totalCount, uniqueActionTypes, uniqueActorNames, error } = data;

  return (
    <div class="p-4 mx-auto max-w-screen-lg">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Audit Logs</h1>
        <p class="text-gray-700">
          Track and monitor security and administrative events in your
          application with WorkOS Audit Logs.
        </p>
      </div>

      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Render the AuditLogsList island with initial data */}
      <AuditLogsList
        initialLogs={logs}
        totalCount={totalCount}
        uniqueActionTypes={uniqueActionTypes}
        uniqueActorNames={uniqueActorNames}
      />

      {/* Information section */}
      <div class="mt-12 bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">About Audit Logs</h2>
        <p class="mb-4">
          Audit logs provide a chronological record of activities performed
          within your application, helping you monitor user actions, system
          events, and security-related activities.
        </p>

        <h3 class="text-lg font-semibold mb-2">Key Benefits</h3>
        <ul class="list-disc pl-5 space-y-1 mb-4">
          <li>Security and compliance monitoring</li>
          <li>User activity tracking</li>
          <li>Troubleshooting and debugging support</li>
          <li>Historical record for accountability</li>
          <li>Detection of suspicious activities</li>
        </ul>

        <h3 class="text-lg font-semibold mb-2">Implementation</h3>
        <p class="mb-2">
          With WorkOS Audit Logs, you can:
        </p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Define custom event schemas for your application</li>
          <li>
            Track events with detailed information about actors, targets, and
            context
          </li>
          <li>Export logs for compliance purposes or advanced analysis</li>
          <li>Build user interfaces to search and analyze activity</li>
          <li>
            Integrate with your security information and event management (SIEM)
            systems
          </li>
        </ul>

        <div class="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 class="font-medium mb-2">Sample Implementation Code</h4>
          <pre class="bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
{`// Record an audit log event
await workos.auditLogs.createEvent(
  "org_123",
  {
    action: "user.login",
    occurredAt: new Date(),
    actor: {
      id: "user_123",
      name: "John Doe",
      type: "user"
    },
    targets: [{
      id: "application_1",
      name: "Dashboard",
      type: "application"
    }],
    context: {
      location: "192.168.1.1",
      userAgent: "Mozilla/5.0..."
    }
  }
);`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
