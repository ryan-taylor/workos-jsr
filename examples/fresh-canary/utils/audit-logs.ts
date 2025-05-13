import { WorkOS } from '../../../src/workos.ts';
import type { AuditLogExportOptions } from '../../../src/audit-logs/interfaces/audit-log-export-options.interface.ts';
import type { AuditLogExport } from '../../../src/audit-logs/interfaces/audit-log-export.interface.ts';

// Mock data for demonstration purposes
export interface AuditLogEvent {
  id: string;
  action: string;
  occurredAt: Date;
  actor: {
    id: string;
    name: string;
    type: string;
  };
  targets: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  context: {
    location: string;
    userAgent?: string;
  };
  metadata?: Record<string, string | number | boolean>;
}

// Initialize WorkOS and Audit Logs
export function initAuditLogs() {
  // Initialize WorkOS with the API key
  const apiKey = Deno.env.get('WORKOS_API_KEY') ?? 'sk_test_your_key_here';
  const workos = new WorkOS(apiKey);

  return { workos };
}

// Function to create an audit log export
export async function createAuditLogExport(
  workos: WorkOS,
  options: AuditLogExportOptions,
): Promise<AuditLogExport> {
  return await workos.auditLogs.createExport(options);
}

// Function to fetch the status/result of an audit log export
export async function getAuditLogExport(
  workos: WorkOS,
  exportId: string,
): Promise<AuditLogExport> {
  return await workos.auditLogs.getExport(exportId);
}

// Get mock audit logs for demonstration purposes
export async function getMockAuditLogs(options: {
  actions?: string[];
  actorNames?: string[];
  organizationId?: string;
  rangeStart?: Date;
  rangeEnd?: Date;
  page?: number;
  limit?: number;
}): Promise<{ data: AuditLogEvent[]; hasMore: boolean; totalCount: number }> {
  // Create sample events
  const events: AuditLogEvent[] = [
    {
      id: 'audit_log_1',
      action: 'user.login',
      occurredAt: new Date(Date.now() - 1000000),
      actor: {
        id: 'user_1',
        name: 'John Doe',
        type: 'user',
      },
      targets: [
        {
          id: 'application_1',
          name: 'WorkOS Dashboard',
          type: 'application',
        },
      ],
      context: {
        location: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    },
    {
      id: 'audit_log_2',
      action: 'user.logout',
      occurredAt: new Date(Date.now() - 900000),
      actor: {
        id: 'user_1',
        name: 'John Doe',
        type: 'user',
      },
      targets: [
        {
          id: 'application_1',
          name: 'WorkOS Dashboard',
          type: 'application',
        },
      ],
      context: {
        location: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    },
    {
      id: 'audit_log_3',
      action: 'user.password_reset',
      occurredAt: new Date(Date.now() - 800000),
      actor: {
        id: 'user_2',
        name: 'Jane Smith',
        type: 'user',
      },
      targets: [
        {
          id: 'user_2',
          name: 'Jane Smith',
          type: 'user',
        },
      ],
      context: {
        location: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    },
    {
      id: 'audit_log_4',
      action: 'organization.updated',
      occurredAt: new Date(Date.now() - 700000),
      actor: {
        id: 'user_3',
        name: 'Admin User',
        type: 'user',
      },
      targets: [
        {
          id: 'org_1',
          name: 'Acme Inc',
          type: 'organization',
        },
      ],
      context: {
        location: '192.168.1.3',
      },
      metadata: {
        updated_fields: 'name,description',
        organization_size: 150,
      },
    },
    {
      id: 'audit_log_5',
      action: 'user.role_updated',
      occurredAt: new Date(Date.now() - 600000),
      actor: {
        id: 'user_3',
        name: 'Admin User',
        type: 'user',
      },
      targets: [
        {
          id: 'user_1',
          name: 'John Doe',
          type: 'user',
        },
      ],
      context: {
        location: '192.168.1.3',
      },
      metadata: {
        new_role: 'admin',
        // old_role reference removed
      },
    },
    {
      id: 'audit_log_6',
      action: 'api_key.created',
      occurredAt: new Date(Date.now() - 500000),
      actor: {
        id: 'user_3',
        name: 'Admin User',
        type: 'user',
      },
      targets: [
        {
          id: 'apikey_1',
          name: 'API Key 1',
          type: 'api_key',
        },
      ],
      context: {
        location: '192.168.1.3',
      },
    },
    {
      id: 'audit_log_7',
      action: 'user.login',
      occurredAt: new Date(Date.now() - 400000),
      actor: {
        id: 'user_2',
        name: 'Jane Smith',
        type: 'user',
      },
      targets: [
        {
          id: 'application_1',
          name: 'WorkOS Dashboard',
          type: 'application',
        },
      ],
      context: {
        location: '192.168.1.4',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      },
    },
    {
      id: 'audit_log_8',
      action: 'document.accessed',
      occurredAt: new Date(Date.now() - 300000),
      actor: {
        id: 'user_2',
        name: 'Jane Smith',
        type: 'user',
      },
      targets: [
        {
          id: 'doc_1',
          name: 'Confidential Report',
          type: 'document',
        },
      ],
      context: {
        location: '192.168.1.4',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      },
    },
    {
      id: 'audit_log_9',
      action: 'organization.member_added',
      occurredAt: new Date(Date.now() - 200000),
      actor: {
        id: 'user_3',
        name: 'Admin User',
        type: 'user',
      },
      targets: [
        {
          id: 'user_4',
          name: 'New User',
          type: 'user',
        },
        {
          id: 'org_1',
          name: 'Acme Inc',
          type: 'organization',
        },
      ],
      context: {
        location: '192.168.1.3',
      },
    },
    {
      id: 'audit_log_10',
      action: 'settings.updated',
      occurredAt: new Date(Date.now() - 100000),
      actor: {
        id: 'user_3',
        name: 'Admin User',
        type: 'user',
      },
      targets: [
        {
          id: 'settings_1',
          name: 'Security Settings',
          type: 'settings',
        },
      ],
      context: {
        location: '192.168.1.3',
      },
      metadata: {
        changes: 'mfa_required:false->true,session_timeout:30->15',
      },
    },
  ];

  // Apply filters
  let filteredEvents = [...events];

  if (options.actions && options.actions.length > 0) {
    filteredEvents = filteredEvents.filter((event) => options.actions!.includes(event.action));
  }

  if (options.actorNames && options.actorNames.length > 0) {
    filteredEvents = filteredEvents.filter((event) =>
      options.actorNames!.some((name) => event.actor.name.toLowerCase().includes(name.toLowerCase()))
    );
  }

  if (options.rangeStart) {
    filteredEvents = filteredEvents.filter((event) => event.occurredAt >= options.rangeStart!);
  }

  if (options.rangeEnd) {
    filteredEvents = filteredEvents.filter((event) => event.occurredAt <= options.rangeEnd!);
  }

  // Get page and limit
  const page = options.page || 1;
  const limit = options.limit || 10;
  const startIdx = (page - 1) * limit;
  const endIdx = startIdx + limit;

  // Slice the results for pagination
  const paginatedEvents = filteredEvents.slice(startIdx, endIdx);

  return {
    data: paginatedEvents,
    hasMore: endIdx < filteredEvents.length,
    totalCount: filteredEvents.length,
  };
}

// Helper function to get unique action types from logs
export function getUniqueActionTypes(logs: AuditLogEvent[]): string[] {
  const actionSet = new Set<string>();
  logs.forEach((log) => {
    actionSet.add(log.action);
  });
  return [...actionSet];
}

// Helper function to get unique actor names from logs
export function getUniqueActorNames(logs: AuditLogEvent[]): string[] {
  const actorSet = new Set<string>();
  logs.forEach((log) => {
    if (log.actor.name) {
      actorSet.add(log.actor.name);
    }
  });
  return [...actorSet];
}
