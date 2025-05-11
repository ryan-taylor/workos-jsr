import { assertEquals, assertExists } from '@std/assert';
import type { AuditLogs } from '../src/audit-logs/audit-logs.ts';
import type { HttpClientError } from '../src/core/errors.ts';
import { createMockWorkOS } from './utils.ts';

// ===== createEvent Tests =====

Deno.test('AuditLogs.createEvent: successfully creates an audit log event', async () => {
  // Mock response for successful event creation (returns void)
  const { workos, client } = createMockWorkOS({});

  const organizationId = 'org_123456';
  const eventData = {
    action: 'user.login',
    occurredAt: new Date(),
    actor: {
      id: 'user_123',
      type: 'user',
      name: 'John Doe',
    },
    targets: [
      {
        id: 'resource_456',
        type: 'resource',
        name: 'Protected Resource',
      },
    ],
    context: {
      location: '192.168.1.1',
    },
    metadata: {
      successful: true,
    },
  };

  // Call the method
  await workos.auditLogs.createEvent(organizationId, eventData);

  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.method, 'POST');
  assertEquals(requestDetails.url, '/audit_logs/events');

  // Verify request body
  const body = requestDetails.body;
  assertExists(body);
  assertEquals(body.organization_id, organizationId);
  assertExists(body.event);
  assertEquals(body.event.action, eventData.action);
  assertEquals(body.event.actor.id, eventData.actor.id);
  assertEquals(body.event.actor.type, eventData.actor.type);
  assertEquals(body.event.targets.length, 1);
  assertEquals(body.event.targets[0].id, eventData.targets[0].id);
  assertEquals(body.event.targets[0].type, eventData.targets[0].type);
});

Deno.test('AuditLogs.createEvent: handles error responses', async () => {
  // Mock error response
  const errorResponse = {
    error_type: 'validation_error',
    message: 'Invalid event data',
  };

  const { workos } = createMockWorkOS(errorResponse, 400);

  // Prepare test data
  const organizationId = 'org_123456';
  const eventData = {
    action: 'user.login',
    occurredAt: new Date(),
    actor: {
      id: 'user_123',
      type: 'user',
    },
    targets: [
      {
        id: 'resource_456',
        type: 'resource',
      },
    ],
    context: {
      location: '192.168.1.1',
    },
  };

  // Attempt to create event and expect error
  let error: HttpClientError | undefined;
  try {
    await workos.auditLogs.createEvent(organizationId, eventData);
  } catch (e) {
    error = e as HttpClientError;
  }

  // Verify error was thrown
  assertExists(error);
  assertEquals(error?.status, 400);
});

// ===== createExport Tests =====

Deno.test('AuditLogs.createExport: successfully creates an audit log export', async () => {
  // Mock response for successful export creation
  const mockResponse = {
    object: 'audit_log_export',
    id: 'audit_export_123',
    state: 'pending',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const { workos, client } = createMockWorkOS(mockResponse);

  // Prepare test data
  const exportOptions = {
    organizationId: 'org_123456',
    rangeStart: new Date('2023-01-01'),
    rangeEnd: new Date('2023-01-31'),
    actions: ['user.login', 'user.logout'],
    actorNames: ['John Doe'],
  };

  // Call the method
  const result = await workos.auditLogs.createExport(exportOptions);

  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.method, 'POST');
  assertEquals(requestDetails.url, '/audit_logs/exports');

  // Verify request body
  const body = requestDetails.body;
  assertExists(body);
  assertEquals(body.organization_id, exportOptions.organizationId);
  assertExists(body.range_start);
  assertExists(body.range_end);
  assertEquals(body.actions, exportOptions.actions);
  assertEquals(body.actor_names, exportOptions.actorNames);

  // Verify response was properly deserialized
  assertEquals(result.object, 'audit_log_export');
  assertEquals(result.id, 'audit_export_123');
  assertEquals(result.state, 'pending');
  assertEquals(result.createdAt, '2023-01-01T00:00:00Z');
  assertEquals(result.updatedAt, '2023-01-01T00:00:00Z');
});

Deno.test('AuditLogs.createExport: handles error responses', async () => {
  // Mock error response
  const errorResponse = {
    error_type: 'validation_error',
    message: 'Invalid date range',
  };

  const { workos } = createMockWorkOS(errorResponse, 400);

  // Prepare test data
  const exportOptions = {
    organizationId: 'org_123456',
    rangeStart: new Date('2023-02-01'),
    rangeEnd: new Date('2023-01-01'), // Invalid: end before start
  };

  // Attempt to create export and expect error
  let error: HttpClientError | undefined;
  try {
    await workos.auditLogs.createExport(exportOptions);
  } catch (e) {
    error = e as HttpClientError;
  }

  // Verify error was thrown
  assertExists(error);
  assertEquals(error?.status, 400);
});

// ===== getExport Tests =====

Deno.test('AuditLogs.getExport: successfully retrieves an audit log export', async () => {
  // Mock response for successful export retrieval
  const mockResponse = {
    object: 'audit_log_export',
    id: 'audit_export_123',
    state: 'ready',
    url: 'https://example.com/export.csv',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T01:00:00Z',
  };

  const { workos, client } = createMockWorkOS(mockResponse);

  // Call the method
  const exportId = 'audit_export_123';
  const result = await workos.auditLogs.getExport(exportId);

  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.method, 'GET');
  assertEquals(requestDetails.url, `/audit_logs/exports/${exportId}`);

  // Verify response was properly deserialized
  assertEquals(result.object, 'audit_log_export');
  assertEquals(result.id, exportId);
  assertEquals(result.state, 'ready');
  assertEquals(result.url, 'https://example.com/export.csv');
  assertEquals(result.createdAt, '2023-01-01T00:00:00Z');
  assertEquals(result.updatedAt, '2023-01-01T01:00:00Z');
});

Deno.test('AuditLogs.getExport: handles error responses', async () => {
  // Mock error response
  const errorResponse = {
    error_type: 'not_found',
    message: 'Audit log export not found',
  };

  const { workos } = createMockWorkOS(errorResponse, 404);

  // Attempt to get non-existent export and expect error
  let error: HttpClientError | undefined;
  try {
    await workos.auditLogs.getExport('audit_export_nonexistent');
  } catch (e) {
    error = e as HttpClientError;
  }

  // Verify error was thrown
  assertExists(error);
  assertEquals(error?.status, 404);
});

// ===== createSchema Tests =====

Deno.test('AuditLogs.createSchema: successfully creates an audit log schema', async () => {
  // Mock response for successful schema creation
  const mockResponse = {
    object: 'audit_log_schema',
    version: 1,
    targets: [
      {
        type: 'document',
        metadata: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            size: { type: 'number' },
          },
        },
      },
    ],
    actor: {
      metadata: {
        type: 'object',
        properties: {
          department: { type: 'string' },
        },
      },
    },
    created_at: '2023-01-01T00:00:00Z',
  };

  const { workos, client } = createMockWorkOS(mockResponse);

  // Prepare test data
  const schemaOptions = {
    action: 'document.access',
    targets: [
      {
        type: 'document',
        metadata: {
          name: 'string',
          size: 'number',
        },
      },
    ],
    actor: {
      metadata: {
        department: 'string',
      },
    },
  };

  // Call the method
  const result = await workos.auditLogs.createSchema(schemaOptions);

  // Verify the request was made correctly
  const requestDetails = client.getRequestDetails();
  assertEquals(requestDetails.method, 'POST');
  assertEquals(requestDetails.url, `/audit_logs/actions/${schemaOptions.action}/schemas`);

  // Verify response was properly deserialized
  assertEquals(result.object, 'audit_log_schema');
  assertEquals(result.version, 1);
  assertEquals(result.targets.length, 1);
  assertEquals(result.targets[0].type, 'document');
  assertExists(result.actor);
  assertEquals(result.createdAt, '2023-01-01T00:00:00Z');
});

Deno.test('AuditLogs.createSchema: handles error responses', async () => {
  // Mock error response
  const errorResponse = {
    error_type: 'validation_error',
    message: 'Invalid schema definition',
  };

  const { workos } = createMockWorkOS(errorResponse, 400);

  // Prepare test data with invalid schema
  const schemaOptions = {
    action: 'document.access',
    targets: [], // Invalid: empty targets array
  };

  // Attempt to create schema and expect error
  let error: HttpClientError | undefined;
  try {
    await workos.auditLogs.createSchema(schemaOptions);
  } catch (e) {
    error = e as HttpClientError;
  }

  // Verify error was thrown
  assertExists(error);
  assertEquals(error?.status, 400);
});
